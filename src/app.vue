<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6">
      <h1 class="text-3xl font-bold mb-6 text-center text-blue-600">123网盘浏览器</h1>

      <!-- 登录表单 -->
      <div v-if="!user" class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <input v-model="username" 
               placeholder="用户名" 
               class="border border-gray-300 p-2 rounded w-full sm:w-auto flex-1">
        <input v-model="password" 
               placeholder="密码" 
               type="password" 
               class="border border-gray-300 p-2 rounded w-full sm:w-auto flex-1">
        <button @click="handleLogin" 
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow">
          登录
        </button>
      </div>

      <!-- 文件浏览器 -->
      <div v-else>
        <div class="flex items-center justify-between mb-4">
          <p class="text-gray-700">已登录：<span class="font-semibold">{{ user.username }}</span></p>
          <button @click="logout" 
                  class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow">
            退出登录
          </button>
        </div>

        <div class="border rounded-lg bg-gray-50 p-4 max-h-[70vh] overflow-y-auto">
          <ul>
            <li v-for="file in files" :key="file.FileId" class="mb-1">
              <div class="flex items-center gap-2 cursor-pointer group"
                   @click="file.Type === 1 ? loadFolder(file) : download(file)">
                <span v-if="file.Type === 1" class="text-blue-600 group-hover:text-blue-800">
                  📁 {{ file.FileName }}
                </span>
                <span v-else class="group-hover:text-gray-800">
                  📄 {{ file.FileName }}
                </span>
              </div>

              <!-- 子文件夹 -->
              <ul v-if="expanded[file.FileId]" class="ml-6 border-l pl-3 mt-1">
                <li v-for="sub in expanded[file.FileId]" :key="sub.FileId" class="mb-1">
                  <div class="flex items-center gap-2 cursor-pointer group"
                       @click="sub.Type === 1 ? loadFolder(sub) : download(sub)">
                    <span v-if="sub.Type === 1" class="text-blue-600 group-hover:text-blue-800">
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