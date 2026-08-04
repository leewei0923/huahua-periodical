# 百度站长平台URL推送脚本 (PowerShell版本)

# 检查urls.txt文件是否存在，如果不存在则从sitemap生成
if (-not (Test-Path "urls.txt")) {
    Write-Host "urls.txt文件不存在，正在从sitemap生成..." -ForegroundColor Yellow
    
    # 获取sitemap.xml内容
    $sitemapUrl = "https://huahua.7miaoyu.com/sitemap.xml"
    try {
        $response = Invoke-WebRequest -Uri $sitemapUrl -UseBasicParsing
        $xml = [xml]$response.Content
        
        # 提取所有URL
        $urls = $xml.urlset.url.loc
        
        # 保存到urls.txt
        $urls | Out-File -FilePath "urls.txt" -Encoding UTF8
        Write-Host "已生成urls.txt，包含 $($urls.Count) 个URL" -ForegroundColor Green
    }
    catch {
        Write-Host "无法获取sitemap: $_" -ForegroundColor Red
        Write-Host "请手动创建urls.txt文件，每行一个URL" -ForegroundColor Yellow
        exit 1
    }
}

# 检查urls.txt文件是否有内容
$content = Get-Content "urls.txt" -ErrorAction SilentlyContinue
if (-not $content -or $content.Count -eq 0) {
    Write-Host "错误: urls.txt文件为空" -ForegroundColor Red
    exit 1
}

$urlCount = $content.Count
Write-Host "准备推送 $urlCount 个URL到百度站长平台" -ForegroundColor Cyan

# 执行curl命令推送URL
Write-Host "正在推送..." -ForegroundColor Yellow

# 使用curl.exe（Windows10/11内置）而不是PowerShell的Invoke-WebRequest
$curlCommand = "curl.exe"
$pushUrl = 'http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX'
$curlArgs = @(
    "-H", "Content-Type:text/plain",
    "--data-binary", "@urls.txt",
    $pushUrl
)

try {
    $response = & $curlCommand @curlArgs
    
    Write-Host "推送完成，服务器响应:" -ForegroundColor Green
    Write-Host $response -ForegroundColor White
    
    # 尝试解析JSON响应
    try {
        $json = $response | ConvertFrom-Json
        if ($json.success -ne $null) {
            Write-Host ""
            Write-Host "成功推送: $($json.success) 个URL" -ForegroundColor Green
            Write-Host "今日剩余配额: $($json.remain) 个URL" -ForegroundColor Cyan
        }
    }
    catch {
        # JSON解析失败，显示原始响应
    }
}
catch {
    Write-Host "错误: curl命令执行失败: $_" -ForegroundColor Red
    exit 1
}