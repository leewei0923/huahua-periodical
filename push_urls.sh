#!/bin/bash
# 百度站长平台URL推送脚本

# 检查urls.txt文件是否存在
if [ ! -f "urls.txt" ]; then
    echo "错误: urls.txt文件不存在"
    echo "请先创建urls.txt文件，每行一个URL"
    exit 1
fi

# 检查urls.txt文件是否有内容
if [ ! -s "urls.txt" ]; then
    echo "错误: urls.txt文件为空"
    exit 1
fi

# 显示将要推送的URL数量
url_count=$(wc -l < "urls.txt")
echo "准备推送 $url_count 个URL到百度站长平台"

# 执行curl命令推送URL
echo "正在推送..."
response=$(curl -s -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX")

# 检查curl命令是否成功
if [ $? -eq 0 ]; then
    echo "推送完成，服务器响应:"
    echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
    
    # 解析响应
    success=$(echo "$response" | grep -o '"success":[0-9]*' | cut -d':' -f2)
    remain=$(echo "$response" | grep -o '"remain":[0-9]*' | cut -d':' -f2)
    
    if [ ! -z "$success" ] && [ ! -z "$remain" ]; then
        echo "成功推送: $success 个URL"
        echo "今日剩余配额: $remain 个URL"
    fi
else
    echo "错误: curl命令执行失败"
    exit 1
fi