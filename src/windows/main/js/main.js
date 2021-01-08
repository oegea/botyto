const { ipcRenderer } = window;
let started = false;

function startStopServer(){
    if (started === false){
        ipcRenderer.send("start", "");
        started = true;
        return;
    }

    started = false;
    ipcRenderer.send("stop", "");
    
}

function openConfig(){
    ipcRenderer.send("open-config", "");
}

ipcRenderer.on('terminal-message', (event, message) => {
    const terminalEl = document.getElementsByClassName("terminal")[0];
    terminalEl.innerHTML += `${message}<br />`;
})