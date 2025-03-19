# 嘎嘎白话跟时事 (GaGa Tech Talk)

![版本](https://img.shields.io/badge/版本-1.0.0-orange)
![Flask](https://img.shields.io/badge/Flask-2.0.1-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.0-purple)

## 项目简介
「嘎嘎白话跟时事」是一款AI驱动的科技广播内容编辑工具，专为科技教育和普及设计。它能够将复杂的AI和半导体技术文章转化为高中生都能理解的生动内容，并提供语音合成功能，一键生成专业的广播稿件。

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=嘎嘎白话跟时事截图" alt="嘎嘎白话跟时事应用截图" width="80%">
</div>

## 功能特点
- **智能内容转化**：将专业技术文章自动转化为通俗易懂、有趣生动的科普内容
- **自定义系统提示词**：可调整AI生成内容的风格和结构
- **语音合成**：一键将生成的内容转为自然流畅的播报音频
- **多参数调节**：支持调整语速、音量、音调和情绪
- **现代UI设计**：采用玻璃态设计风格，界面简洁美观

## 安装指南
### 环境要求
- Python 3.8+
- 现代浏览器（Chrome, Firefox, Edge等）

### 安装步骤
1. 克隆仓库到本地
   ```bash
   git clone https://github.com/yourusername/GaGa-Tech-Talk.git
   cd GaGa-Tech-Talk
   ```

2. 安装依赖包
   ```bash
   pip install -r requirements.txt
   ```

3. 配置环境变量
   ```
   # 创建.env文件并添加以下内容
   MINIMAX_API_KEY=your_api_key_here
   MINIMAX_GROUP_ID=your_group_id_here
   ```

4. 启动服务器
   ```bash
   python server.py
   ```

5. 打开浏览器访问
   ```
   http://localhost:5000
   ```

## 使用方法
1. **输入原始内容**：将需要转化的技术文章粘贴到左侧输入框
2. **生成广播内容**：点击"生成内容"按钮，等待AI处理
3. **语音合成**：点击"生成语音"按钮，将文字转为语音
4. **调整参数**：根据需要调整语音的速度、音量和音调
5. **下载音频**：点击下载按钮保存生成的MP3文件

## 技术架构
- **前端**：HTML5 + CSS3 + JavaScript + Bootstrap 5
- **后端**：Flask (Python)
- **AI模型**：MiniMax Text-01 (文本生成) + MiniMax T2A v2 (语音合成)
- **数据存储**：浏览器localStorage

## 系统提示词
系统采用了专为高中生设计的AI提示词模板，确保生成的内容：
- 使用生动的口语化表达
- 通过比喻和类比解释复杂概念
- 控制句子长度和结构，易于理解
- 保持准确性的同时增加趣味性
- 结构清晰，层次分明

## 许可证
MIT License

## 贡献指南
欢迎提交Issue和Pull Request来帮助改进这个项目！

## 联系方式
Email: qiri4z@ifree8.com
