# 一行命令版本（PowerShell）

# 方式1：直接推送已有的urls.txt
curl.exe -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"

# 方式2：自动生成urls.txt并推送（完整命令）
$sitemapUrl = "https://huahua.7miaoyu.com/sitemap.xml"; $response = Invoke-WebRequest -Uri $sitemapUrl -UseBasicParsing; $xml = [xml]$response.Content; $xml.urlset.url.loc | Out-File -FilePath "urls.txt" -Encoding UTF8; curl.exe -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"