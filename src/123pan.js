// src/pan.js
export const headers = (token) => ({
    "user-agent": "123pan/v2.4.0(Android_7.1.2;Xiaomi)",
    "content-type": "application/json",
    "osversion": "Android_7.1.2",
    "loginuuid": crypto.randomUUID().replace(/-/g, ""),
    "platform": "android",
    "devicetype": "M2101K9C",
    "x-channel": "1004",
    "devicename": "Xiaomi",
    "app-version": "61",
    "x-app-version": "2.4.0",
    ...(token ? { authorization: token } : {})
});

export async function login(username, password) {
    const res = await fetch('https://www.123pan.com/b/api/user/sign_in', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ type: 1, passport: username, password })
    });
    const data = await res.json();
    if (data.code === 200) {
        const token = 'Bearer ' + data.data.token;
        localStorage.setItem('token', token); // 保存本地
        return token;
    } else {
        throw new Error(data.message);
    }
}

export async function getFiles(token, parentId = 0) {
    const res = await fetch(`https://www.123pan.com/b/api/file/list/new?driveId=0&limit=100&next=0&orderBy=file_id&orderDirection=desc&parentFileId=${parentId}&trashed=false&SearchData=&Page=1&OnlyLookAbnormalFile=0`, {
        headers: headers(token)
    });
    const data = await res.json();
    return data.data.InfoList || [];
}

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
    if (data.code !== 0 || !data.data.DownloadUrl) {
        throw new Error('获取下载链接失败: ' + data.message);
    }
    const a = document.createElement('a');
    a.href = data.data.DownloadUrl;
    a.download = file.FileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
}
