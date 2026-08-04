# 快速推送指南

## PowerShell用户

### 一键生成并推送（复制整个命令执行）
```powershell
$sitemapUrl = "https://huahua.7miaoyu.com/sitemap.xml"; $response = Invoke-WebRequest -Uri $sitemapUrl -UseBasicParsing; $xml = [xml]$response.Content; $xml.urlset.url.loc | Out-File -FilePath "urls.txt" -Encoding UTF8; curl.exe -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"
```

### 分步执行
1. 生成urls.txt：
```powershell
$sitemapUrl = "https://huahua.7miaoyu.com/sitemap.xml"
$response = Invoke-WebRequest -Uri $sitemapUrl -UseBasicParsing
$xml = [xml]$response.Content
$xml.urlset.url.loc | Out-File -FilePath "urls.txt" -Encoding UTF8
```

2. 推送URL：
```powershell
curl.exe -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"
```

## Linux/Mac用户

### 一键生成并推送
```bash
curl -s "https://huahua.7miaoyu.com/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<loc>//g;s/<\/loc>//g' > urls.txt && curl -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"
```

### 分步执行
1. 生成urls.txt：
```bash
curl -s "https://huahua.7miaoyu.com/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<loc>//g;s/<\/loc>//g' > urls.txt
```

2. 推送URL：
```bash
curl -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"
```

## 注意事项

1. Windows用户必须使用 `curl.exe` 而不是 `curl`（PowerShell中curl是Invoke-WebRequest的别名）
2. 确保网络可以访问 `https://huahua.7miaoyu.com/sitemap.xml`
3. 每个账号每天有推送配额限制
4. 推送成功后会返回JSON响应，显示成功数量和剩余配额