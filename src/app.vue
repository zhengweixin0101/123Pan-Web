<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">123网盘浏览器</h1>
    
    <div v-if="!user" class="mb-4">
      <input v-model="username" placeholder="用户名" class="border p-2 mr-2">
      <input v-model="password" placeholder="密码" type="password" class="border p-2 mr-2">
      <button @click="handleLogin" class="bg-blue-500 text-white px-4 py-2 rounded">登录</button>
    </div>

    <div v-else>
      <p class="mb-4">已登录用户：{{ user.username }}</p>
      <button @click="logout" class="bg-red-500 text-white px-4 py-2 rounded mb-4">退出登录</button>
      <div>
        <ul>
          <li v-for="file in files" :key="file.FileId" class="mb-1">
            <span v-if="file.Type === 1" class="text-blue-600 cursor-pointer" @click="loadFolder(file)">
              📁 {{ file.FileName }}
            </span>
            <span v-else class="cursor-pointer" @click="download(file)">
              📄 {{ file.FileName }}
            </span>
            <ul v-if="expanded[file.FileId]" class="ml-4">
              <li v-for="sub in expanded[file.FileId]" :key="sub.FileId">
                <span v-if="sub.Type === 1" class="text-blue-600 cursor-pointer" @click="loadFolder(sub)">
                  📁 {{ sub.FileName }}
                </span>
                <span v-else class="cursor-pointer" @click="download(sub)">
                  📄 {{ sub.FileName }}
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { login, getFiles, downloadFile } from './123pan.js';

const username = ref('');
const password = ref('');
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
const files = ref([]);
const expanded = ref({});

async function handleLogin() {
  try {
    const token = await login(username.value, password.value);
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

<style>
body { font-family: sans-serif; }
</style>