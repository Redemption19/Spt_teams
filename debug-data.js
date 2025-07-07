// Debug script to check what's actually in the Firestore collections
// This should be run in the browser console or as a separate script

console.log('🔍 Starting database debug check...');

// Check if we can access the Firebase instance
if (typeof window !== 'undefined' && window.firebase) {
  console.log('✅ Firebase is available');
  
  // Get Firestore instance
  const db = window.firebase.firestore();
  
  // Check tasks collection
  db.collection('tasks').limit(10).get().then(snapshot => {
    console.log('📋 Tasks collection - Total documents:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('📋 Sample task documents:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('  - Task ID:', doc.id);
        console.log('  - Title:', data.title);
        console.log('  - WorkspaceId:', data.workspaceId);
        console.log('  - ProjectId:', data.projectId);
        console.log('  - Status:', data.status);
        console.log('  - AssigneeId:', data.assigneeId);
        console.log('  ---');
      });
    } else {
      console.log('❌ No tasks found in the collection');
    }
  }).catch(error => {
    console.error('❌ Error fetching tasks:', error);
  });
  
  // Check teams collection
  db.collection('teams').limit(10).get().then(snapshot => {
    console.log('👥 Teams collection - Total documents:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('👥 Sample team documents:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('  - Team ID:', doc.id);
        console.log('  - Name:', data.name);
        console.log('  - WorkspaceId:', data.workspaceId);
        console.log('  ---');
      });
    } else {
      console.log('❌ No teams found in the collection');
    }
  }).catch(error => {
    console.error('❌ Error fetching teams:', error);
  });
  
  // Check reports collection
  db.collection('reports').limit(10).get().then(snapshot => {
    console.log('📄 Reports collection - Total documents:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('📄 Sample report documents:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('  - Report ID:', doc.id);
        console.log('  - Title:', data.title);
        console.log('  - WorkspaceId:', data.workspaceId);
        console.log('  - Status:', data.status);
        console.log('  - AuthorId:', data.authorId);
        console.log('  ---');
      });
    } else {
      console.log('❌ No reports found in the collection');
    }
  }).catch(error => {
    console.error('❌ Error fetching reports:', error);
  });
  
  // Check workspaces collection
  db.collection('workspaces').limit(10).get().then(snapshot => {
    console.log('🏢 Workspaces collection - Total documents:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('🏢 Sample workspace documents:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('  - Workspace ID:', doc.id);
        console.log('  - Name:', data.name);
        console.log('  - Type:', data.workspaceType);
        console.log('  - CreatedBy:', data.createdBy);
        console.log('  ---');
      });
    } else {
      console.log('❌ No workspaces found in the collection');
    }
  }).catch(error => {
    console.error('❌ Error fetching workspaces:', error);
  });
  
} else {
  console.log('❌ Firebase is not available. Make sure you\'re running this in the browser console.');
}

console.log('🔍 Debug check complete. Check the console for results.');
