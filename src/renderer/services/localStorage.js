import fs from 'fs-extra';
import { 
  LOCAL_PROJECTS, LANGUAGE, EDITOR, SUBMIT_PATH, VSCODE_PATH, UPDATE_TIP,
  LOCAL_TEMP_PATHS, REMOTE_TEMP_URLS, SUBLIME, VSCODE
} from 'gui-const';

const storage = window.localStorage;

export const getStoreProjects = () => JSON.parse(storage.getItem(LOCAL_PROJECTS)) || [];

export const setLocalProjects = (projects) => {
  storage.setItem(LOCAL_PROJECTS, JSON.stringify(projects));
};

export const getLocalProjects = () => {
  const projects = getStoreProjects();
  // 检查项目是否存在
  const filter = projects.filter(project => fs.existsSync(project.path));

  setLocalProjects(filter);

  return filter;
};

export const getLocalTemplateUpdate = type => storage.getItem(type);
export const setLocalTemplateUpdate = (type, date) => storage.setItem(type, date);

export const getLocalLanguage = () => storage.getItem(LANGUAGE);
export const setLocalLanguage = language => storage.setItem(LANGUAGE, language);

export const getLocalEditor = () => storage.getItem(EDITOR);
export const setLocalEditor = editor => storage.setItem(EDITOR, editor);

/*export const getLocalSublimePath = () => storage.getItem(SUBMIT_PATH);
export const setLocalSublimePath = sublimePath => storage.setItem(SUBMIT_PATH, sublimePath);

export const getLocalVScodePath = () => storage.getItem(VSCODE_PATH);
export const setLocalVScodePath = vscodePath => storage.setItem(VSCODE_PATH, vscodePath);
*/
export const getLocalEditorPath = (editor) => {
  if (editor === SUBLIME) {
    return storage.getItem(SUBMIT_PATH);
  }
  return storage.getItem(VSCODE_PATH);
};

export const setLocalEditorPath = (editor, editorPath) => {
  if (editor === SUBLIME) {
    storage.setItem(SUBMIT_PATH, editorPath);
  }
  if (editor === VSCODE) {
    storage.setItem(VSCODE_PATH, editorPath);
  }
};

export const getLocalUpdateFlag = () => storage.getItem(UPDATE_TIP);
export const setLocalUpdateFlag = () => storage.setItem(UPDATE_TIP, 1);

/*export const setLocalCustomTemps = temps => storage.setItem(LOCAL_TEMP_PATHS, JSON.stringify(temps));
export const getStoreCustomTemps = () => JSON.parse(storage.getItem(LOCAL_TEMP_PATHS) || '[]');
export const getLocalCustomTemps = () => {
  const temps = getStoreCustomTemps();
  const filter = temps.filter(temp => fs.existsSync(temp.path));

  setLocalCustomTemps(filter);

  return filter;
};

export const getRemoteTemps = () => JSON.parse(storage.getItem(REMOTE_TEMP_URLS) || '[]');
export const setRemoteTemps = temps => storage.setItem(REMOTE_TEMP_URLS, JSON.stringify(temps));*/