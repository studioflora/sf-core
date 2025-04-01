console.log('reading sf-core');

class Sfignal {
   constructor(value) {
      this._value = value;
      this._subscribers = new Set();
   }
 
   set state(newValue) {
      if (this._value !== newValue) {
         this._value = newValue;
         this._sync();
      }
   }
 
   get state() {
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
const myState = new Sfignal(0);
const unsubscribe = myState.subscribe(value => { console.log(value) }); or just
myState.subscribe(value => { console.log(value) });
myState.state = 1;
unsubscribe();
*/

let db;

function dbCheckOverwrite(projectName, callback) {
   const request = db.transaction('projects').objectStore('projects').get(projectName);
   request.onsuccess = () => callback(!!request.result);
   request.onerror = () => callback(false);
}

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

function dbDeleteProject(projectName, onSuccess, onError) {
   if (!confirm(`Delete "${projectName}"?`)) {
      return;
   }
   const transaction = db.transaction(['projects'], 'readwrite');
   const store = transaction.objectStore('projects');
   const request = store.delete(projectName);
 
   request.onsuccess = () => {
     console.log(`Project "${projectName}" deleted`);
     if (onSuccess) onSuccess();
   };
   
   request.onerror = () => {
     console.error(`Error deleting project "${projectName}"`);
     if (onError) onError();
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
      const projects = event.target.result.map(project => ({
         name: project.name,
         ...project.data,
         lastEdit: Date.now()
      }));
      if (projects && projects.length > 0) {
         console.log('Projects retrieved successfully.');
         console.log(projects);
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