class Sfignal {
   constructor(value) {
      this._value = value;
      this._subscribers = new Set();
   }
 
   set value(newValue) {
      if (this._value !== newValue) {
         this._value = newValue;
         this._sync();
      }
   }
 
   get value() {
      return this._value;
   }
 
   subscribe(callback) {
      this._subscribers.add(callback);
      return () => this._subscribers.delete(callback);
   }
 
   _sync() {
      this._subscribers.forEach(callback => callback(this._value));
   }
}
 
 /* Usage
 const state = new Sfignal(0);
 
 const unsubscribe = state.subscribe(value => {
   console.log('State updated:', value);
 });
 
 state.value = 1; // Logs: "State updated: 1"
 unsubscribe(); // Stop receiving updates
 state.value = 2; // No logs, since we unsubscribed
 */

let db;

function initDB() {
   const request = indexedDB.open('ProjectDB', 1);
   request.onupgradeneeded = function(event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains('projects')) {
         db.createObjectStore('projects', { keyPath: 'name' });
      }
   };
   request.onsuccess = function(event) {
      db = event.target.result;
      console.log('Database initialized successfully.');
   };
   request.onerror = function(event) {
      console.error('Error opening database:', event.target.error);
   };
}

function dbStoreProject(projectName, projectData) {
   if (!db) {
      alert('Local saves not possible. Please download anything you want to keep!');
      return;
   }
   const transaction = db.transaction(['projects'], 'readwrite');
   const store = transaction.objectStore('projects');
   const request = store.get(projectName);
   request.onsuccess = function(event) {
      // if (event.target.result) {
      //    const overwrite = confirm('A project with this name already exists. Overwrite?');
      //    if (!overwrite) return;
      // }
      const putRequest = store.put({ name: projectName, data: projectData });
      putRequest.onsuccess = function() {
         console.log('Project saved successfully.');
      };
      putRequest.onerror = function(event) {
         alert('Error saving project. Please try again.');
         console.error('Error saving project:', event.target.error);
      };
   };
   request.onerror = function(event) {
      alert('Error checking project. Please try again.');
      console.error('Error checking project:', event.target.error);
   };
}

function dbRetrieveProjects(callback) {
   if (!db) {
      console.warn('No local projects found.');
      return;
   }
   const transaction = db.transaction(['projects'], 'readonly');
   const store = transaction.objectStore('projects');
   const request = store.getAll();
   request.onsuccess = function(event) {
      const projects = event.target.result;
      if (projects && projects.length > 0) {
         console.log('Projects retrieved successfully.');
         callback(projects);
      } else {
         console.warn('No local projects found.');
      }
   };
   request.onerror = function(event) {
      console.warn('Error retrieving local projects.');
      console.error('Error retrieving projects:', event.target.error);
   };
}