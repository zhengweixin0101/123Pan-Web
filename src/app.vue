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

        <div class="border rounded-lg bg-gray-50 px-4 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 shadow-inner mb-6">
          <ul>
            <li v-for="file in files" :key="file.FileId" class="mb-2 -ml-10 list-none">
              <div class="flex items-center justify-between gap-2 p-2 rounded hover:bg-blue-50 transition-colors">
                <div class="flex items-center gap-2 cursor-pointer" @click="file.Type === 1 ? loadFolder(file) : download(file)">
                  <span v-if="file.Type === 1" class="group-hover:text-blue-500 font-medium transition-colors">
                    📁 {{ file.FileName }}
                  </span>
                  <span v-else class="group-hover:text-gray-800">
                    📄 {{ file.FileName }}
                  </span>
                </div>
                  <div @click.stop="deleteSingleFile(file, 0)" class="text-red-500 hover:text-red-900">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 50 50" fill="currentColor">
                      <path d="M 21 2 C 19.354545 2 18 3.3545455 18 5 L 18 7 L 10.154297 7 A 1.0001 1.0001 0 0 0 9.984375 6.9863281 A 1.0001 1.0001 0 0 0 9.8398438 7 L 8 7 A 1.0001 1.0001 0 1 0 8 9 L 9 9 L 9 45 C 9 46.645455 10.354545 48 12 48 L 38 48 C 39.645455 48 41 46.645455 41 45 L 41 9 L 42 9 A 1.0001 1.0001 0 1 0 42 7 L 40.167969 7 A 1.0001 1.0001 0 0 0 39.841797 7 L 32 7 L 32 5 C 32 3.3545455 30.645455 2 29 2 L 21 2 z M 21 4 L 29 4 C 29.554545 4 30 4.4454545 30 5 L 30 7 L 20 7 L 20 5 C 20 4.4454545 20.445455 4 21 4 z M 11 9 L 18.832031 9 A 1.0001 1.0001 0 0 0 19.158203 9 L 30.832031 9 A 1.0001 1.0001 0 0 0 31.158203 9 L 39 9 L 39 45 C 39 45.554545 38.554545 46 38 46 L 12 46 C 11.445455 46 11 45.554545 11 45 L 11 9 z M 18.984375 13.986328 A 1.0001 1.0001 0 0 0 18 15 L 18 40 A 1.0001 1.0001 0 1 0 20 40 L 20 15 A 1.0001 1.0001 0 0 0 18.984375 13.986328 z M 24.984375 13.986328 A 1.0001 1.0001 0 0 0 24 15 L 24 40 A 1.0001 1.0001 0 1 0 26 40 L 26 15 A 1.0001 1.0001 0 0 0 24.984375 13.986328 z M 30.984375 13.986328 A 1.0001 1.0001 0 0 0 30 15 L 30 40 A 1.0001 1.0001 0 1 0 32 40 L 32 15 A 1.0001 1.0001 0 0 0 30.984375 13.986328 z"></path>
                    </svg>
                  </div>
              </div>

              <!-- 子文件夹 -->
              <ul v-if="expanded[file.FileId]" class="ml-4 border-l pl-4 mt-1">
                <li v-for="sub in expanded[file.FileId]" :key="sub.FileId" class="mb-1 list-none">
                  <div class="flex items-center justify-between gap-2 p-2 rounded hover:bg-blue-50 transition-colors">
                    <div class="flex items-center gap-2 cursor-pointer" @click="sub.Type === 1 ? loadFolder(sub) : download(sub)">
                      <span v-if="sub.Type === 1" class="group-hover:text-blue-800 font-medium transition-colors">
                        📁 {{ sub.FileName }}
                      </span>
                      <span v-else class="group-hover:text-gray-800">
                        📄 {{ sub.FileName }}
                      </span>
                    </div>
                    <div @click.stop="deleteSingleFile(sub, file.FileId)" class="text-red-500 hover:text-red-900">
                      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 50 50" fill="currentColor">
                        <path d="M 21 2 C 19.354545 2 18 3.3545455 18 5 L 18 7 L 10.154297 7 A 1.0001 1.0001 0 0 0 9.984375 6.9863281 A 1.0001 1.0001 0 0 0 9.8398438 7 L 8 7 A 1.0001 1.0001 0 1 0 8 9 L 9 9 L 9 45 C 9 46.645455 10.354545 48 12 48 L 38 48 C 39.645455 48 41 46.645455 41 45 L 41 9 L 42 9 A 1.0001 1.0001 0 1 0 42 7 L 40.167969 7 A 1.0001 1.0001 0 0 0 39.841797 7 L 32 7 L 32 5 C 32 3.3545455 30.645455 2 29 2 L 21 2 z M 21 4 L 29 4 C 29.554545 4 30 4.4454545 30 5 L 30 7 L 20 7 L 20 5 C 20 4.4454545 20.445455 4 21 4 z M 11 9 L 18.832031 9 A 1.0001 1.0001 0 0 0 19.158203 9 L 30.832031 9 A 1.0001 1.0001 0 0 0 31.158203 9 L 39 9 L 39 45 C 39 45.554545 38.554545 46 38 46 L 12 46 C 11.445455 46 11 45.554545 11 45 L 11 9 z M 18.984375 13.986328 A 1.0001 1.0001 0 0 0 18 15 L 18 40 A 1.0001 1.0001 0 1 0 20 40 L 20 15 A 1.0001 1.0001 0 0 0 18.984375 13.986328 z M 24.984375 13.986328 A 1.0001 1.0001 0 0 0 24 15 L 24 40 A 1.0001 1.0001 0 1 0 26 40 L 26 15 A 1.0001 1.0001 0 0 0 24.984375 13.986328 z M 30.984375 13.986328 A 1.0001 1.0001 0 0 0 30 15 L 30 40 A 1.0001 1.0001 0 1 0 32 40 L 32 15 A 1.0001 1.0001 0 0 0 30.984375 13.986328 z"></path>
                      </svg>
                    </div>
                  </div>
                </li>
              </ul>
            </li>
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
import { login, getFiles, downloadFile, deleteFile, parseShareFolder } from './123pan.js';
import 'uno.css'

const username = ref('');
const password = ref('');
const shareUrl = ref('');
const sharePwd = ref('');
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
const files = ref([]);
const expanded = ref({});
const shareFiles = ref([]);

// 登录
async function handleLogin() {
  try {
    await login(username.value, password.value);
    user.value = JSON.parse(localStorage.getItem('user'));
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
    // 使用 a 标签触发下载
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
async function deleteSingleFile(file, parentId = 0) {
  if (!confirm(`确认删除 "${file.FileName}" 吗？`)) return;
  try {
    await deleteFile(user.value.token, file);
    if (parentId === 0) {
      await loadRoot();
    } else {
      expanded.value[parentId] = await getFiles(user.value.token, parentId);
    }
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}


// 登出
function logout() {
  localStorage.removeItem('user');
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