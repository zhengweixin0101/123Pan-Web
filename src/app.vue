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
            class="p-3 rounded-lg w-full sm:w-auto flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-[0_0_2px_rgba(0,0,0,1)] border-none"
          >
          <input 
            v-model="password"
            id="password"
            name="password"
            type="password" 
            autocomplete="current-password"
            placeholder="密码" 
            class="p-3 rounded-lg w-full sm:w-auto flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-[0_0_2px_rgba(0,0,0,1)] border-none"
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

        <div class="border rounded-lg bg-gray-50 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 shadow-inner">
          <ul>
            <li v-for="file in files" :key="file.FileId" class="mb-2 -ml-10 list-none">
              <div 
                class="flex items-center gap-2 cursor-pointer group p-2 rounded hover:bg-blue-50 transition-colors"
                @click="file.Type === 1 ? loadFolder(file) : download(file)"
              >
                <span v-if="file.Type === 1" class="group-hover:text-blue-500 font-medium transition-colors">
                  📁 {{ file.FileName }}
                </span>
                <span v-else class="group-hover:text-gray-800">
                  📄 {{ file.FileName }}
                </span>
              </div>

              <ul v-if="expanded[file.FileId]" class="ml-4 border-l pl-4 mt-1">
                <li v-for="sub in expanded[file.FileId]" :key="sub.FileId" class="mb-1 list-none">
                  <div 
                    class="flex items-center gap-2 cursor-pointer group p-2 rounded hover:bg-blue-50 transition-colors"
                    @click="sub.Type === 1 ? loadFolder(sub) : download(sub)"
                  >
                    <span v-if="sub.Type === 1" class="text-blue-600 group-hover:text-blue-800 font-medium transition-colors">
                      📁 {{ sub.FileName }}
                    </span>
                    <span v-else class="group-hover:text-gray-800">
                      📄 {{ sub.FileName }}
                    </span>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { login, getFiles, downloadFile } from './123pan.js';
import 'uno.css'

const username = ref('');
const password = ref('');
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
const files = ref([]);
const expanded = ref({});

async function handleLogin() {
  try {
    await login(username.value, password.value);
    user.value = JSON.parse(localStorage.getItem('user'));
    await loadRoot();
  } catch (err) {
    alert('登录失败: ' + err.message);
  }
}

async function loadRoot() {
  if (!user.value) return;
  files.value = await getFiles(user.value.token, 0);
}

async function loadFolder(file) {
  if (expanded.value[file.FileId]) {
    delete expanded.value[file.FileId];
  } else {
    expanded.value[file.FileId] = await getFiles(user.value.token, file.FileId);
  }
}

function download(file) {
  downloadFile(user.value.token, file);
}

function logout() {
  localStorage.removeItem('user');
  user.value = null;
  files.value = [];
  expanded.value = {};
}

onMounted(async () => {
  if (user.value) {
    await loadRoot();
  }
});
</script>