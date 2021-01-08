const { ipcRenderer } = window;
let started = false;

function save(){
    const config = {
        username: '',
        password: '',
        channelName: '',
        pointName: '',
        pointsPerMinute: 1,
        pointsInterval: 5,
        adminName: '',
        donorText: '',
        networkText: '',
        hidratacionCost: 30,
        messageCost: 30,
        dadoCost: 10
    }

    for (let i in config){
        config[i] = document.getElementById(i).value;
    }

    ipcRenderer.send("save-config", config);
    
}

ipcRenderer.on('load-config', (event, config) => {
    for (let i in config){
        document.getElementById(i).value = config[i];
    }
});

ipcRenderer.send('request-config', '');