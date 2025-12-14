<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex flex-col items-center">
    <div class="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-8 mt-10">
      <h1 class="text-4xl font-extrabold mb-8 text-center text-blue-500">
        123网盘下载
      </h1>

      <!-- 未登录 -->
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

      <!-- 已登录 -->
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
          <div v-if="isLoading" class="py-6 space-y-2">
            <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <ul v-else>
            <FileItem
              v-for="file in files"
              :key="file.FileId"
              :file="file"
              :level="0"
              :deletable="true"
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

      <div class="border rounded-lg bg-gray-50 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 shadow-inner">
        <div v-if="isParsing" class="py-6 space-y-2">
          <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <ul v-else-if="shareFiles.length">
          <FileItem
            v-for="f in shareFiles"
            :key="f.FileId"
            :file="f"
            :level="0"
            :deletable="false"
            :share-key="shareKeyRef"
            :share-pwd="sharePwd"
            @download="download"
          />
        </ul>
        <p v-else class="text-gray-400">暂无文件</p>
      </div>
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
const shareFiles = ref([]);
const shareKeyRef = ref('');

const isLoading = ref(false);           // 根目录加载
const isParsing = ref(false);           // 分享解析

// 登录
async function handleLogin() {
  isLoading.value = true;
  try {
    await login(username.value, password.value);
    user.value = JSON.parse(Cookies.get('user'));
    // 暴露给子组件作为回退 token 获取方式
    window.__USER__ = user.value;
    await loadRoot();
  } catch (err) {
    alert('登录失败: ' + err.message);
  } finally {
    isLoading.value = false;
  }
}

// 根目录文件
async function loadRoot() {
  if (!user.value) return;
  isLoading.value = true;
  try {
    const list = await getFiles(user.value.token, 0);
    // 把 token 附加到每个文件对象，供子组件懒加载时使用
    files.value = list.map(f => ({ ...f, _token: user.value.token }));
  } catch (err) {
    alert('加载文件失败: ' + err.message);
  } finally {
    isLoading.value = false;
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
    const list = await getFiles(user.value.token, 0);
    files.value = list.map(f => ({ ...f, _token: user.value.token }));
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// 登出
function logout() {
  Cookies.remove('user');
  user.value = null;
  files.value = [];
  shareFiles.value = [];
  window.__USER__ = null;
}

// 解析分享链接
async function parseShare() {
  if (!shareUrl.value) return alert('请输入分享链接');
  isParsing.value = true;
  try {
    const urlStr = shareUrl.value.trim();
    let shareKey = '';
    let pwd = sharePwd.value.trim();
    const sIndex = urlStr.indexOf('/s/');
    if (sIndex === -1) return alert('分享链接格式异常');

    let endIndex = urlStr.indexOf('?', sIndex);
    if (endIndex === -1) endIndex = urlStr.indexOf('#', sIndex);
    if (endIndex === -1) endIndex = urlStr.length;

    shareKey = urlStr.substring(sIndex + 3, endIndex);

    if (!pwd) {
      const pwdIndex = urlStr.indexOf('?pwd=');
      if (pwdIndex !== -1) {
        pwd = urlStr.substring(pwdIndex + 5, pwdIndex + 9);
      }
    }

    shareKeyRef.value = shareKey;
    // 把解析出来的提取码写回 sharePwd，确保子组件懒加载时使用相同提取码
    sharePwd.value = pwd;
    shareFiles.value = await parseShareFolder(user.value.token, shareKey, pwd);
  } catch (err) {
    alert('解析失败: ' + err.message);
  } finally {
    isParsing.value = false;
  }
}

// 初始化
onMounted(async () => {
  if (user.value) {
    window.__USER__ = user.value;
    await loadRoot();
  }
});
</script>