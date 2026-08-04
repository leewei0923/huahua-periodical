# 百度站长平台URL推送

## 准备工作

### 方法1：自动生成urls.txt（推荐）

运行PowerShell脚本，它会自动从sitemap.xml获取所有URL：

```powershell
.\push_urls.ps1
```

### 方法2：手动创建urls.txt

创建 `urls.txt` 文件，每行一个URL，例如：
```
https://huahua.7miaoyu.com/
https://huahua.7miaoyu.com/about
https://huahua.7miaoyu.com/contact
```

## 推送命令

### PowerShell命令（直接复制执行）

```powershell
curl.exe -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"
```

### Linux/Mac命令

```bash
curl -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://huahua.7miaoyu.com&token=5Wt1AYMH36uWj0YX"
```

## 完整脚本

### Windows (PowerShell)
```powershell
# 给脚本添加执行权限（如果需要）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 运行脚本
.\push_urls.ps1
```

### Linux/Mac
```bash
chmod +x push_urls.sh
./push_urls.sh
```

## 响应说明

成功响应示例：
```json
{
    "remain": 99998,
    "success": 2,
    "not_same_site": [],
    "not_valid": []
}
```

- `success`: 成功推送的URL条数
- `remain`: 当天剩余的可推送URL条数
- `not_same_site`: 由于不是本站URL而未处理的URL列表
- `not_valid`: 不合法的URL列表

## 注意事项

1. 每个账号每天有推送配额限制
2. URL必须是本站域名下的链接
3. URL必须是有效的HTTP/HTTPS链接
4. 文件编码建议使用UTF-8
5. Windows用户请使用 `curl.exe` 而不是 `curl`（PowerShell中curl是Invoke-WebRequest的别名）