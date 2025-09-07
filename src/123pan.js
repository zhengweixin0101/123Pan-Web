function setCookie(name, value, days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

export const headers = (token) => ({
    "user-agent": "123pan/v2.4.0(Android_7.1.2;Xiaomi)",
    "content-type": "application/json",
    "osversion": "Android_7.1.2",
    "loginuuid": crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).substring(2, 18),
    "platform": "android",
    "devicetype": "M2101K9C",
    "x-channel": "1004",
    "devicename": "Xiaomi",
    "app-version": "61",
    "x-app-version": "2.4.0",
    ...(token ? { authorization: token } : {})
})

// 登录
function maskUsername(username) {
    if (!username) return ''

    // 手机号
    if (/^\d{11}$/.test(username)) {
        return username.slice(0, 3) + '****' + username.slice(-4)
    }

    // 邮箱
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
        const [name, domain] = username.split('@')
        if (name.length <= 2) {
            return name[0] + '*' + '@' + domain
        }
        return name[0] + '****' + name.slice(-1) + '@' + domain
    }

    // 普通用户名
    if (username.length <= 2) return username
    if (username.length <= 4) {
        return username[0] + '**' + username.slice(-1)
    }
    return username.slice(0, 2) + '****' + username.slice(-2)
}

export async function login(username, password) {
    const res = await fetch('https://www.123pan.com/b/api/user/sign_in', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ type: 1, passport: username, password })
    })
    const data = await res.json()
    if (data.code === 200) {
        const token = 'Bearer ' + data.data.token
        const maskedUsername = maskUsername(username)
        setCookie('user', JSON.stringify({ username: maskedUsername, token }), 3)
        return token
    } else {
        throw new Error(data.message)
    }
}

// cookie
export function getUser() {
    const cookieUser = getCookie('user')
    return cookieUser ? JSON.parse(cookieUser) : null
}

// 登出
export function logoutUser() {
    deleteCookie('user')
}

// 获取文件列表
export async function getFiles(token, parentId = 0) {
    const res = await fetch(
        `https://www.123pan.com/b/api/file/list/new?driveId=0&limit=100&next=0&orderBy=file_id&orderDirection=desc&parentFileId=${parentId}&trashed=false&SearchData=&Page=1&OnlyLookAbnormalFile=0`,
        { headers: headers(token) }
    );
    const data = await res.json();
    if (!data.data?.InfoList) return [];

    const result = [];
    for (const item of data.data.InfoList) {
        if (item.Type === 1) {
            const children = await getFiles(token, item.FileId);
            result.push({ ...item, children });
        } else {
            result.push(item);
        }
    }
    return result;
}

// 下载文件
export async function downloadFile(token, file) {
    const res = await fetch('https://www.123pan.com/a/api/file/download_info', {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
            driveId: 0,
            fileId: file.FileId,
            type: file.Type,
            fileName: file.FileName,
            etag: file.Etag || '',
            s3keyFlag: file.S3KeyFlag || '',
            size: file.Size
        })
    });
    const data = await res.json();
    if (data.code !== 0 || !data.data.DownloadUrl) throw new Error('获取下载链接失败: ' + data.message);
    return data.data.DownloadUrl;
}

// 删除文件
export async function deleteFile(token, file, moveToTrash = true) {
    const res = await fetch('https://www.123pan.com/a/api/file/trash', {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
            driveId: 0,
            fileTrashInfoList: [file],
            operation: moveToTrash
        })
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message);
    return true;
}

// 分享解析
export async function parseShareFolder(token, shareKey, pwd = '', parentId = 0) {
    const res = await fetch(
        `https://www.123pan.com/b/api/share/get?limit=100&next=1&orderBy=share_id&orderDirection=desc&shareKey=${shareKey}&SharePwd=${pwd}&ParentFileId=${parentId}&Page=1`,
        { headers: headers(token) }
    );
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message);

    const result = [];
    for (const item of data.data.InfoList) {
        if (item.Type === 1) {
            const children = await parseShareFolder(token, shareKey, pwd, item.FileId);
            result.push({
                ...item,
                children,
            });
        } else {
            const downloadRes = await fetch('https://www.123pan.com/a/api/share/download/info', {
                method: 'POST',
                headers: headers(token),
                body: JSON.stringify({
                    Etag: item.Etag,
                    FileID: item.FileId,
                    S3keyFlag: item.S3KeyFlag,
                    ShareKey: shareKey,
                    Size: item.Size,
                }),
            });
            const downloadData = await downloadRes.json();
            result.push({
                ...item,
                DownloadUrl:
                    downloadData.code === 0 && downloadData.data.DownloadURL
                        ? downloadData.data.DownloadURL
                        : '#',
            });
        }
    }
    return result;
}