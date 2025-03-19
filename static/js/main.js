/**
 * 嘎嘎白话跟时事 - 主要JavaScript文件
 * 创建日期：2025年3月18日
 * 描述：实现AI文本生成和语音合成功能
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化常量和变量
    const API_BASE_URL = "http://localhost:5000"; // 使用本地后端代理服务器
    
    // 缓存DOM元素
    const systemPromptArea = document.getElementById('systemPrompt');
    const originalTextArea = document.getElementById('originalText');
    const aiOutputArea = document.getElementById('aiOutput');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const ttsBtn = document.getElementById('ttsBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const systemPromptToggle = document.getElementById('systemPromptToggle');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const audioPlayer = document.getElementById('audioPlayer');
    
    // 语音设置控件
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const pitchSlider = document.getElementById('pitchSlider');
    const pitchValue = document.getElementById('pitchValue');
    const emotionSelect = document.getElementById('emotionSelect');
    
    // 时事热点区域
    const trendingContainer = document.getElementById('trendingNews');
    
    // 社区作品区域
    const communityContainer = document.getElementById('communityWorks');
    
    // 初始化页面
    initPage();
    
    // 事件监听器设置
    function setupEventListeners() {
        // 系统提示词折叠/展开
        if (systemPromptToggle) {
            systemPromptToggle.addEventListener('click', function() {
                if (systemPromptArea.style.display === 'none') {
                    systemPromptArea.style.display = 'block';
                    systemPromptToggle.textContent = '收起';
                } else {
                    systemPromptArea.style.display = 'none';
                    systemPromptToggle.textContent = '展开';
                }
            });
        }
        
        // 生成AI内容
        if (generateBtn) {
            generateBtn.addEventListener('click', generateAIContent);
        }
        
        // 清空按钮
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                originalTextArea.value = '';
                aiOutputArea.textContent = '';
                showToast('内容已清空');
            });
        }
        
        // 复制按钮
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                if (aiOutputArea.textContent.trim() === '') {
                    showToast('没有内容可复制', 'warning');
                    return;
                }
                
                navigator.clipboard.writeText(aiOutputArea.textContent)
                    .then(() => {
                        showToast('内容已复制到剪贴板');
                    })
                    .catch(err => {
                        showToast('复制失败: ' + err, 'error');
                    });
            });
        }
        
        // TTS按钮
        if (ttsBtn) {
            ttsBtn.addEventListener('click', generateSpeech);
        }
        
        // 停止播放按钮
        if (stopBtn) {
            stopBtn.addEventListener('click', function() {
                if (audioPlayer) {
                    audioPlayer.pause();
                    audioPlayer.currentTime = 0;
                    showToast('播放已停止');
                }
            });
        }
        
        // 下载按钮
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                if (!audioPlayer.src) {
                    showToast('没有可下载的音频', 'warning');
                    return;
                }
                
                // 创建一个下载链接
                const a = document.createElement('a');
                a.href = audioPlayer.src;
                a.download = '嘎嘎白话_' + new Date().toISOString().slice(0,10) + '.mp3';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                showToast('音频下载中...');
            });
        }
        
        // 语音设置滑块
        if (speedSlider) {
            speedSlider.addEventListener('input', function() {
                speedValue.textContent = this.value;
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function() {
                volumeValue.textContent = this.value;
            });
        }
        
        if (pitchSlider) {
            pitchSlider.addEventListener('input', function() {
                pitchValue.textContent = this.value;
            });
        }
        
        // 时事热点点击事件
        if (trendingContainer) {
            const trendingItems = trendingContainer.querySelectorAll('.trending-card');
            trendingItems.forEach(item => {
                item.addEventListener('click', function() {
                    const newsText = this.querySelector('.title').textContent;
                    // 将热点新闻插入到原始文本区域
                    originalTextArea.value = newsText;
                    showToast('已添加热点新闻');
                    // 滚动到编辑区
                    document.querySelector('#editorSection').scrollIntoView({behavior: 'smooth'});
                });
            });
        }
    }
    
    // 初始化页面
    function initPage() {
        // 设置默认的系统提示词 - 确保始终使用PRD中定义的最新提示词
        const defaultPrompt = `你是一档名为《嘎嘎白话跟时事》的AI科技广播节目的资深编辑，名字叫嘎嘎，擅长将专业的AI、半导体时事文章转化为高中生都能听懂的生活化案例广播内容。请将以下原始内容改写成适合播报的稿件。

原始内容
{{input}}
====End======

要求：
1. 请先全面的阅读一遍所有的新闻
2. 使用嘎嘎的身份，用幽默风趣的大白话，给高中生讲清楚最新的资讯
3. 开场先概要说说今天要讲的是哪一件大事，用「30秒电梯法则」提炼新闻：从{{input}}提取1个核心事件+3个关键术语+1个行业影响
4. 新闻概述控制在100字以内，确保听众能在短时间内抓住重点，然后梳理出来三个专业术语关键词进行解读。
  1. 对于每个关键词，设计「恍然大悟时刻」：每200字插入1个"哎这就好比..."类比彩蛋
  2. 技巧参考：
    1. 将数据转化为声音意象（如"这个5纳米工艺啊，相当于把整个清华图书馆塞进你的文具盒！"）
    2. 用拟声词强化记忆点（如"黑客想来撬数据？叮！二级认证直接弹飞攻击"）
    3. 节奏控制：每句话≤14字，复杂概念用"三步拆解法"（是什么→像什么→为什么重要）
5. 语言风格要求：
  - 用生动的口语化表达，用大白话讲出专业性
  - 适当使用语气词增加自然感（比如"嗯"、"那么"、"其实"等），语气词要生动活泼
  - 避免过于口语化的方言用语
  - 像跟朋友聊天一样轻松自然
  - 适当使用幽默，但是比喻要礼貌易懂
6. 在保持通俗易懂的同时，准确传达AI、半导体关键概念的理解方式
7. 适当增加转场语，使话题之间衔接自然，

【输出规范】
嗨，各位听众朋友们！今天嘎嘎要跟大家聊聊一个很有意思的话题：(事件核心+悬念钩子)

我们先来了解一下这个内容的核心：（新闻概述段：含发布日期/产品名称/技术突破/对标对象，用"这就好比…"建立初认知）

这段话涉及到了几个专业概念，嘎嘎来取三个通俗地解释一下：：
1. 第一个词是「术语A」，可不是...(专业定义)。说人话就是...(校园场景类比)，相当于...(流行文化参照)
2. 第二个词是「术语B」听起来玄乎，其实...(原理拆解)。想象一下...(游戏装备类比)，这就解决了...(痛点场景)
3. 第三个词是「术语C」官方说法是...(技术解释)。翻译成咱的话...(日常生活比喻)，这下知道为啥...(行业影响)
 
接下来是总结时间：
嗯，我们今天聊了...，虽然(...技术难点)看着头疼，但只要记住(...类比总结)，就能get到(...颠覆性价值)。下次看见(...应用场景)时，你可以骄傲地说...(成就梗)！
下期见！

【注意事项】
中英文有歧义的词，使用中文音译（ARM→安谋架构、nm→纳米）
不要有超过2行的长难句
不要刻意的网络流行语
输出结果可以直接被朗读，是直接一段一段的话，不要分点和小标题。`;

        // 清除旧的本地存储，确保使用最新的提示词
        localStorage.removeItem('systemPrompt');
        
        // 设置文本区域的值和保存到localStorage
        systemPromptArea.value = defaultPrompt;
        localStorage.setItem('systemPrompt', defaultPrompt);
        
        // 设置语音参数的默认值
        speedSlider.value = 1.2;
        speedValue.textContent = 1.2;
        volumeSlider.value = 1;
        volumeValue.textContent = 1;
        pitchSlider.value = 0;
        pitchValue.textContent = 0;
        
        // 添加页面事件监听器
        setupEventListeners();
        
        // 隐藏加载层
        toggleLoading(false);
    }
    
    // 切换加载状态
    function toggleLoading(show) {
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }
    
    // 显示提示消息
    function showToast(message, type = 'success') {
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 显示后自动消失
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        }, 100);
    }
    
    // 生成AI内容
    async function generateAIContent() {
        // 获取输入内容
        const originalText = originalTextArea.value.trim();
        const systemPrompt = systemPromptArea.value.trim();
        
        // 验证输入
        if (originalText === '') {
            showToast('请输入原始文本', 'warning');
            return;
        }
        
        // 显示加载状态
        toggleLoading(true);
        
        try {
            // 替换提示词中的占位符
            const processedPrompt = systemPrompt.replace('{{input}}', originalText);
            
            // 准备请求数据
            const requestData = {
                system_prompt: processedPrompt,
                user_input: '' // 用户输入已经包含在系统提示词中
            };
            
            // 发送API请求到我们的后端代理
            const response = await fetch(`${API_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // 检查响应
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            // 解析响应数据
            const data = await response.json();
            
            // 更新UI
            if (data.choices && data.choices[0] && data.choices[0].message) {
                aiOutputArea.textContent = data.choices[0].message.content;
                showToast('AI内容生成成功');
            } else {
                throw new Error('API响应格式无效');
            }
        } catch (error) {
            console.error('生成AI内容时出错:', error);
            showToast('生成内容失败: ' + error.message, 'error');
        } finally {
            // 隐藏加载状态
            toggleLoading(false);
        }
    }
    
    // 生成语音
    async function generateSpeech() {
        // 获取AI生成的内容
        const text = aiOutputArea.textContent.trim();
        
        // 验证输入
        if (text === '') {
            showToast('没有可转换为语音的内容', 'warning');
            return;
        }
        
        // 显示加载状态
        toggleLoading(true);
        
        try {
            // 获取语音设置
            const speed = parseFloat(speedSlider.value);
            const volume = parseFloat(volumeSlider.value);
            const pitch = parseFloat(pitchSlider.value);
            const emotion = emotionSelect.value;
            
            // 准备请求数据
            const requestData = {
                text: text,
                speed: speed,
                volume: volume,
                pitch: pitch,
                emotion: emotion
            };
            
            // 发送API请求到我们的后端代理
            const response = await fetch(`${API_BASE_URL}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // 检查响应
            if (!response.ok) {
                throw new Error(`语音API请求失败: ${response.status} ${response.statusText}`);
            }
            
            // 获取二进制音频数据
            const blob = await response.blob();
            
            // 创建对象URL
            const audioUrl = URL.createObjectURL(blob);
            
            // 更新音频播放器
            audioPlayer.src = audioUrl;
            audioPlayer.style.display = 'block';
            
            // 自动播放
            audioPlayer.play()
                .then(() => {
                    showToast('开始播放语音');
                })
                .catch(error => {
                    console.error('自动播放失败:', error);
                    showToast('请点击播放按钮来听取音频', 'info');
                });
            
        } catch (error) {
            console.error('生成语音时出错:', error);
            showToast('生成语音失败: ' + error.message, 'error');
        } finally {
            // 隐藏加载状态
            toggleLoading(false);
        }
    }
    
    // 保存系统提示词到本地存储
    function saveSystemPrompt() {
        localStorage.setItem('systemPrompt', systemPromptArea.value);
        showToast('系统提示词已保存');
    }
    
    // 暴露公共方法
    window.appFunctions = {
        saveSystemPrompt: saveSystemPrompt
    };
});
