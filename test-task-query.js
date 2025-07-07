// Test script to check if tasks are being created and queried correctly
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testTaskQuery() {
  try {
    console.log('🔍 Testing task query...');
    
    // First, let's see all tasks in the collection
    const tasksRef = collection(db, 'tasks');
    const allTasksSnapshot = await getDocs(tasksRef);
    
    console.log('📋 Total tasks in collection:', allTasksSnapshot.size);
    
    // Let's examine some tasks
    const allTasks = [];
    allTasksSnapshot.forEach((doc) => {
      const data = doc.data();
      allTasks.push({
        id: doc.id,
        title: data.title,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        status: data.status
      });
    });
    
    console.log('📋 Sample tasks:', allTasks.slice(0, 5));
    
    // Group by workspace
    const workspaceGroups = {};
    allTasks.forEach(task => {
      if (!workspaceGroups[task.workspaceId]) {
        workspaceGroups[task.workspaceId] = [];
      }
      workspaceGroups[task.workspaceId].push(task);
    });
    
    console.log('📋 Tasks by workspace:');
    Object.keys(workspaceGroups).forEach(workspaceId => {
      console.log(`  Workspace ${workspaceId}: ${workspaceGroups[workspaceId].length} tasks`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTaskQuery();
