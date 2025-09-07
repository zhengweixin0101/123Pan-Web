<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex flex-col items-center">
    <div class="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-8 mt-10">
      <h1 class="text-4xl font-extrabold mb-8 text-center text-blue-500">
        123网盘下载
      </h1>

      <div v-if="!user">
        <form @submit.prevent="handleLogin" class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <input 
            v-model="username" 
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            placeholder="用户名" 
            class="p-3 rounded-lg w-full sm:w-auto flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-[0_0_2px_rgba(0,0,0,1)] border-none transition transform"
          >
          <input 
            v-model="password"
            id="password"
            name="password"
            type="password" 
            autocomplete="current-password"
            placeholder="密码" 
            class="p-3 rounded-lg w-full sm:w-auto flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-[0_0_2px_rgba(0,0,0,1)] border-none transition transform"
          >
          <button 
            type="submit" 
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg border-none shadow-[0_0_2px_rgba(0,0,0,1)] transition transform"
          >
            登录
          </button>
        </form>
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-4">
          <p class="text-gray-700">已登录：<span class="font-semibold">{{ user.username }}</span></p>
          <button 
            @click="logout" 
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg border-none shadow-[0_0_2px_rgba(0,0,0,1)] transition transform"
          >
            退出登录
          </button>
        </div>

        <!-- 文件列表 -->
        <div class="border rounded-lg bg-gray-50 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 shadow-inner mb-6">
          <ul>
            <FileItem
              v-for="file in files"
              :key="file.FileId"
              :file="file"
              :sub-expanded="expanded"
              :level="0"
              @load-folder="loadFolder"
              @download="download"
              @delete-file="deleteSingleFile"
            />
          </ul>
        </div>
      </div>
    </div>

    <!-- 分享解析 -->
    <div v-if="user" class="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-8 mt-6">
      <form @submit.prevent="parseShare" class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <input 
          v-model="shareUrl" 
          id="shareUrl"
          placeholder="分享链接" 
          class="p-3 rounded-lg w-full sm:w-auto flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-[0_0_2px_rgba(0,0,0,1)] border-none transition transform"
        >
        <input 
          v-model="sharePwd" 
          id="sharePwd"
          placeholder="提取码（可选）" 
          class="p-3 rounded-lg w-full sm:w-auto flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-[0_0_2px_rgba(0,0,0,1)] border-none transition transform"
        >
        <button 
          type="submit" 
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg border-none shadow-[0_0_2px_rgba(0,0,0,1)] transition transform"
        >
          解析分享
        </button>
      </form>

      <ul v-if="shareFiles.length" class="space-y-2">
        <li v-for="f in shareFiles" :key="f.FileId">
          <div class="flex items-center justify-between p-2 rounded-lg hover:bg-green-50 transition-colors">
            <a 
              :href="f.DownloadUrl" 
              target="_blank" 
              class="text-gray-800 hover:text-green-700 font-medium truncate"
            >
              📄 {{ f.FileName }}
            </a>
          </div>
        </li>
      </ul>
      <p v-else class="text-gray-400">暂无分享文件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FileItem from './FileItem.vue';
import { login, getFiles, downloadFile, deleteFile, parseShareFolder } from './123pan.js';
import Cookies from 'js-cookie';
import 'uno.css'

const username = ref('');
const password = ref('');
const shareUrl = ref('');
const sharePwd = ref('');
const user = ref(JSON.parse(Cookies.get('user') || 'null'));
const files = ref([]);
const expanded = ref({});
const shareFiles = ref([]);

// 登录
async function handleLogin() {
  try {
    await login(username.value, password.value);

    user.value = JSON.parse(Cookies.get('user'));
    await loadRoot();
  } catch (err) {
    alert('登录失败: ' + err.message);
  }
}

// 根目录文件
async function loadRoot() {
  if (!user.value) return;
  files.value = await getFiles(user.value.token, 0);
}

// 加载子文件夹
async function loadFolder(file) {
  if (expanded.value[file.FileId]) {
    delete expanded.value[file.FileId];
  } else {
    expanded.value[file.FileId] = await getFiles(user.value.token, file.FileId);
  }
}

// 下载
async function download(file) {
  try {
    const url = await downloadFile(user.value.token, file);
    if (!url || url === '#') {
      alert('无法获取下载链接');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = file.FileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    alert('下载失败: ' + err.message);
  }
}

// 删除
async function deleteSingleFile(file) {
  if (!confirm(`确认删除 "${file.FileName}" 吗？`)) return;

  try {
    await deleteFile(user.value.token, file);

    files.value = await getFiles(user.value.token, 0);

    async function refreshExpanded(expObj) {
      for (const key in expObj) {
        expObj[key] = await getFiles(user.value.token, Number(key));
        for (const f of expObj[key]) {
          if (f.Type === 1 && expObj[f.FileId]) {
            await refreshExpanded({ [f.FileId]: expObj[f.FileId] });
          }
        }
      }
    }
    await refreshExpanded(expanded.value);

  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// 登出
function logout() {
  Cookies.remove('user');
  user.value = null;
  files.value = [];
  expanded.value = {};
  shareFiles.value = [];
}

// 解析分享链接
async function parseShare() {
  if (!shareUrl.value) return alert('请输入分享链接');
  try {
    const shareKey = shareUrl.value.split('/').pop().replace('.html', '');
    shareFiles.value = await parseShareFolder(user.value.token, shareKey, sharePwd.value);
  } catch (err) {
    alert('解析失败: ' + err.message);
  }
}

// 初始化
onMounted(async () => {
  if (user.value) {
    await loadRoot();
  }
});
</script>