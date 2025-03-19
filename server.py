#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
嘎嘎白话跟时事 - 后端代理服务器
创建日期：2025年3月18日
描述：这是一个简单的Flask后端服务，用于代理API请求，避免前端跨域问题
"""

from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
import requests
import json
import os
import logging  # 添加日志模块
import base64  # 添加base64编码/解码支持
from dotenv import load_dotenv  # 添加环境变量支持

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__, static_folder='.')
# 允许跨域请求
CORS(app)

# 从环境变量中获取 MiniMax API密钥和GroupID
API_KEY = os.getenv("MINIMAX_API_KEY", "your_api_key_here")
GROUP_ID = os.getenv("MINIMAX_GROUP_ID", "your_group_id_here")

# 用于显示主页的路由
@app.route('/')
def index():
    # 从当前目录提供index.html文件
    return send_from_directory('.', 'index.html')

# 用于提供静态文件的路由
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# 代理MiniMax文本生成API的路由
@app.route('/api/generate', methods=['POST'])
def generate_text():
    """
    代理转发MiniMax的文本生成API请求
    接收前端发来的请求数据，转发给MiniMax API，并返回结果
    """
    try:
        # 获取前端发送的数据
        data = request.json
        logger.info("收到文本生成请求")
        
        # 准备请求MiniMax API的数据
        minimax_data = {
            "model": "MiniMax-Text-01",
            "messages": [
                {
                    "role": "system",
                    "content": data.get('system_prompt', '')
                },
                {
                    "role": "user",
                    "content": data.get('user_input', '')
                }
            ]
        }
        
        logger.debug(f"发送到MiniMax的数据: {json.dumps(minimax_data, ensure_ascii=False)[:200]}...")
        
        # 发送请求到MiniMax API
        response = requests.post(
            "https://api.minimax.chat/v1/text/chatcompletion_v2",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json=minimax_data
        )
        
        # 检查请求是否成功
        response.raise_for_status()
        
        # 输出响应内容前200个字符的日志
        logger.debug(f"MiniMax返回的数据: {response.text[:200]}...")
        
        # 返回MiniMax API的响应
        return jsonify(response.json())
    
    except Exception as e:
        # 捕获并返回错误信息
        logger.error(f"文本生成API调用出错: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 代理MiniMax语音合成API的路由
@app.route('/api/tts', methods=['POST'])
def generate_speech():
    """
    代理转发MiniMax的文本转语音API请求
    接收前端发来的请求数据，转发给MiniMax API，并返回音频数据
    """
    try:
        # 获取前端发送的数据
        data = request.json
        logger.info("收到语音合成请求")
        
        # 获取参数，并进行类型转换
        text = data.get('text', '')
        speed = data.get('speed', 1.2)
        volume = data.get('volume', 1.0)
        pitch = data.get('pitch', 0)
        emotion = data.get('emotion', 'happy')
        
        # 确保pitch是整数
        if isinstance(pitch, float):
            pitch = int(pitch)
        
        # 准备请求MiniMax API的数据
        tts_data = {
            "model": "speech-01-turbo",
            "text": text,
            "stream": False,
            "voice_setting": {
                "voice_id": "qiri_wakaka",
                "speed": float(speed),
                "vol": float(volume),
                "pitch": pitch,  # 确保是整数
                "emotion": emotion
            },
            "audio_setting": {
                "sample_rate": 32000,
                "bitrate": 128000,
                "format": "mp3",
                "channel": 1
            }
        }
        
        logger.debug(f"发送到MiniMax TTS的数据: {json.dumps(tts_data, ensure_ascii=False)}")
        
        # 发送请求到MiniMax API
        url = f"https://api.minimax.chat/v1/t2a_v2?GroupId={GROUP_ID}"
        logger.debug(f"请求URL: {url}")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }
        logger.debug(f"请求头: {headers}")
        
        # 使用非流式请求
        response = requests.post(
            url,
            headers=headers,
            json=tts_data,
            stream=False
        )
        
        # 检查请求是否成功
        response.raise_for_status()
        
        # 记录完整响应信息
        logger.info(f"语音合成响应状态码: {response.status_code}")
        logger.info(f"语音合成响应头: {response.headers}")
        
        # 记录完整响应体前部分
        response_text = response.text
        logger.info(f"语音合成响应体(前500字符): {response_text[:500]}...")
        
        try:
            # 尝试解析为JSON
            response_json = response.json()
            logger.info(f"解析为JSON的响应体: {json.dumps(response_json, ensure_ascii=False)[:500]}...")
            
            # 检查响应中是否有错误
            if 'base_resp' in response_json and response_json['base_resp'].get('status_code', 0) != 0:
                error_message = response_json['base_resp'].get('status_msg', '未知错误')
                logger.error(f"API返回错误: {error_message}")
                return jsonify({"error": error_message}), 500
            
            # 从响应中提取音频数据
            audio_data = None
            
            # 检查标准音频字段
            if 'audio' in response_json and response_json['audio']:
                audio_data = response_json['audio']
                logger.info(f"找到'audio'字段，长度: {len(str(audio_data))}")
            # 检查另一种可能的字段名
            elif 'data' in response_json and 'audio' in response_json['data']:
                audio_data = response_json['data']['audio']
                logger.info(f"找到'data.audio'字段，长度: {len(str(audio_data))}")
            
            # 如果找到了音频数据
            if audio_data:
                audio_binary = None
                
                # 判断音频数据类型并进行相应处理
                if isinstance(audio_data, str):
                    try:
                        # 尝试作为十六进制字符串解码
                        audio_binary = bytes.fromhex(audio_data)
                        logger.info(f"成功解码十六进制音频数据，大小: {len(audio_binary)} 字节")
                    except ValueError:
                        try:
                            # 如果十六进制解码失败，尝试base64解码
                            audio_binary = base64.b64decode(audio_data)
                            logger.info(f"成功解码Base64音频数据，大小: {len(audio_binary)} 字节")
                        except Exception as e:
                            logger.error(f"音频数据解码失败: {str(e)}")
                            return jsonify({"error": "音频数据格式错误"}), 500
                else:
                    logger.error(f"未知的音频数据格式: {type(audio_data)}")
                    return jsonify({"error": "未知的音频数据格式"}), 500
                
                # 返回音频二进制数据
                return Response(
                    audio_binary,
                    content_type="audio/mpeg",
                    headers={
                        "Content-Disposition": "attachment;filename=speech.mp3",
                        "Cache-Control": "no-cache",
                        "Access-Control-Allow-Origin": "*"
                    }
                )
            else:
                logger.error(f"API响应中没有找到音频数据")
                # 尝试检查响应中的其他结构
                logger.error(f"完整响应数据: {json.dumps(response_json, ensure_ascii=False)}")
                return jsonify({"error": "API响应中没有找到音频数据"}), 500
        
        except json.JSONDecodeError:
            # 如果不是JSON格式，记录错误并尝试查看更多信息
            logger.error(f"响应不是有效的JSON格式")
            
            # 检查响应内容的前100个字符，判断可能的格式
            sample = response_text[:100]
            logger.info(f"响应内容示例: {sample}")
            
            # 尝试直接作为二进制数据返回
            # 这种情况下，响应可能直接是MP3数据
            if b'ID3' in response.content[:10] or b'\xFF\xFB' in response.content[:10]:
                logger.info("检测到可能的MP3标记，尝试直接返回二进制数据")
                return Response(
                    response.content,
                    content_type="audio/mpeg",
                    headers={
                        "Content-Disposition": "attachment;filename=speech.mp3",
                        "Cache-Control": "no-cache",
                        "Access-Control-Allow-Origin": "*"
                    }
                )
            else:
                # 如果不确定是什么格式，仍然尝试返回
                logger.info("未检测到明确的音频格式标记，但仍尝试返回内容")
                return Response(
                    response.content,
                    content_type="audio/mpeg",
                    headers={
                        "Content-Disposition": "attachment;filename=speech.mp3",
                        "Cache-Control": "no-cache",
                        "Access-Control-Allow-Origin": "*"
                    }
                )
    
    except Exception as e:
        # 捕获并返回错误信息
        logger.error(f"语音合成API调用出错: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 主函数
if __name__ == '__main__':
    # 在开发模式下启动服务器，生产环境应该使用gunicorn或uwsgi
    print("嘎嘎白话跟时事 - 后端服务器启动成功！")
    print("请在浏览器中访问: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
