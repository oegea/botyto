const { ipcRenderer } = window;
let started = false;
let customCommands = [];

function createCommand(){
    customCommands.push({
        label: '',
        cost: 0,
        action: 'CHAT',
        message: '',
        isAdminCommand: false,
        videoImage: 'poring.gif',
        videoSound: 'alert.mp3',
    });
    
    const id = customCommands.length-1;
    loadCustomCommand(customCommands[id], id);
}

function appendCommand(id){
    const newCommand = document.createElement('div');
    newCommand.className = 'custom-command-wrapper';
    newCommand.id = 'command_wrapper_' + id;
    newCommand.innerHTML = `
        <label for="command_label_${id}">Command Label (e.g. !hello)</label>
        <input type="text" min="0" max="50" id="command_label_${id}" placeholder="Command Label (e.g. !hello)" />
        <label for="command_cost_${id}">Command Cost</label>
        <input class="custom-command-cost" type="number" min="0" id="command_cost_${id}" placeholder="Command Cost"/>
        <label for="command_action_${id}">Action Type</label>
        <select id="command_action_${id}">
            <option value="CHAT">Chat Message</option>
            <option value="VIDEO">Video Alert</option>
            <option value="KEY">Press a key</option>
        </select>
        <label id="label_video_image_${id}" for="command_video_image_${id}">Video Image</label>
        <input type="text" min="0" max="50" id="command_video_image_${id}" placeholder="Video Image" />
        <label id="label_video_sound_${id}" for="command_video_sound_${id}">Video Sound</label>
        <input type="text" min="0" max="50" id="command_video_sound_${id}" placeholder="Video Sound" />
        <label for="command_message_${id}">Message to send/Key to press</label>
        <textarea id="command_message_${id}" placeholder="Message to send"></textarea>
        <input type="checkbox" min="0" max="50" id="command_admin_${id}"/>Is Admin Command
        <div style="text-align: right; cursor: pointer;" onclick="deleteCommand(${id})">Delete</div>
    `;
    document.getElementById("commands-wrapper").append(newCommand);

    //Events when any field changes
    document.querySelector(`#command_label_${id}`).addEventListener('change',function(){ 
        updateCommand(customCommands, 'label', id, this.value) });
    document.querySelector(`#command_cost_${id}`).addEventListener('change',function(){ 
        updateCommand(customCommands, 'cost', id, this.value) });
    document.querySelector(`#command_action_${id}`).addEventListener('change',function(){ 
        updateCommand(customCommands, 'action', id, this.value) });
    document.querySelector(`#command_message_${id}`).addEventListener('change',function(){ 
        updateCommand(customCommands, 'message', id, this.value) });
    document.querySelector(`#command_video_image_${id}`).addEventListener('change',function(){ 
        updateCommand(customCommands, 'videoImage', id, this.value) });
    document.querySelector(`#command_video_sound_${id}`).addEventListener('change',function(){ 
        updateCommand(customCommands, 'videoSound', id, this.value) });
    document.querySelector(`#command_admin_${id}`).addEventListener('change',function(){ 
        updateCommand(customCommands, 'isAdminCommand', id, !customCommands[id].isAdminCommand) });

    
}

function updateCommand(customCommands, field, id, value){
    customCommands[id][field] = value;
    toggleVideoFields(field, value, id);
}

function toggleVideoFields(field, value, id){
    if (field === 'action' && value !== 'VIDEO'){
        document.querySelector('#command_video_image_'+id).style.display = "none"; 
        document.querySelector('#command_video_sound_'+id).style.display = "none"; 
        document.querySelector('#label_video_image_'+id).style.display = "none"; 
        document.querySelector('#label_video_sound_'+id).style.display = "none"; 
    }else if (field === 'action'){
        document.querySelector('#command_video_image_'+id).style.display = "block"; 
        document.querySelector('#command_video_sound_'+id).style.display = "block"; 
        document.querySelector('#label_video_image_'+id).style.display = "block"; 
        document.querySelector('#label_video_sound_'+id).style.display = "block"; 
    }
}

function deleteCommand(position){
    customCommands.splice(position);
    document.getElementById(`command_wrapper_${position}`).remove();
}

function loadCustomCommands(){
    for(let i = 0; i < customCommands.length; i++){
        loadCustomCommand(customCommands[i], i);
    }
}

function loadCustomCommand(customCommand, id){
    appendCommand(id);
    document.getElementById(`command_label_${id}`).value = customCommand.label;
    document.getElementById(`command_cost_${id}`).value = customCommand.cost;
    document.getElementById(`command_action_${id}`).value = customCommand.action;
    document.getElementById(`command_message_${id}`).value = customCommand.message;
    document.getElementById(`command_video_image_${id}`).value = customCommand.videoImage;
    document.getElementById(`command_video_sound_${id}`).value = customCommand.videoSound;
    document.getElementById(`command_admin_${id}`).checked = customCommand.isAdminCommand;
    toggleVideoFields('action', customCommand.action, id);
}


function save(){
    const config = {
        username: '',
        password: '',
        channelName: '',
        pointName: '',
        pointsPerMinute: 1,
        pointsInterval: 5,
        adminName: '',
        messageCost: 30,
    }

    for (let i in config){
        config[i] = document.getElementById(i).value;
    }
    
    config.customCommands = customCommands;

    ipcRenderer.send("save-config", config);
    
}

ipcRenderer.on('load-config', (event, config) => {
    for (let i in config){
        //Parámetros que no deben ser tratados de forma estándar
        if (i === 'customCommands'){
            customCommands = config[i]; //Hemos de poder operar con los comandos en otros puntos
            loadCustomCommands();
        }
        else
            document.getElementById(i).value = config[i];
    }
});

ipcRenderer.send('request-config', '');