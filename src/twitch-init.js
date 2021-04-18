/**
 * Inicializa Chatbot de Twitch
 */
class TwitchInit {

    /**
     * CTOR
     * @param {Object} express Configuración e instancia de Express
     * @param {Object} storage Sistema de info persistente
     * @param {Object} config Configuración de la aplicación
     * @param {Object} logger Librería para enviar mensajes de log por pantalla
     */
    constructor(express, storage, config, logger){
        //Propiedades
        this.robot = require('robotjs');
        this.express = express;
        this.config = config;
        this.storage = storage;
        this.logger = logger;
        const Users = require('./libs/users.js');
        this.users = new Users(storage);
        this.currentlyDoing = `¡${this.config.adminName} aún no me ha dicho qué está haciendo, puedes recordarle que lo haga!`;
        this.currentRaffle = {
            active: false,
            description: '',
            cost: 0,
            participants: []
        }

        this.chatPlay = false;
        this.chatPlayer = '';

        //Carga de dependencias de terceros
        const tmi = require('tmi.js');

        // Define configuration options
        const opts = {
            identity: {
                username: this.config.username,
                password: this.config.password
            },
            channels: [
                this.config.channelName
            ]
        };
        // Create a client with our options
        this.client = new tmi.client(opts);
        
        // Register our event handlers (defined below)
        this.client.on('message', this.onMessageHandler.bind(this));
        this.client.on('connected', this.onConnectedHandler.bind(this));
        this.client.on('disconnected', this.onDisconnectedHandler.bind(this))
        // Connect to Twitch:
        this.client.connect();

    }

    /**
     * Se desconecta de la API
     */
    async close(){
        await this.client.disconnect();
    }

    /**
     * Obtiene un número aleatorio
     * @param {Number} min Número mínimo
     * @param {Number} max Número máximo
     */
    getRandomInt(min, max) {
        max = max + 1;
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * Procesa los mensajes de chat
     */
    async onMessageHandler (target, context, msg, self) {
        if (self) { return; } // Ignore messages from the bot
    
        // Remove whitespace from chat message
        const commandName = msg.split(' ')[0];
        //Recopilamos info necesaria
        const { username } = context;
        // If the command is known, let's execute it
        switch(commandName){
            default:
                this.execCustomCommand(target, context, msg, self, commandName, username);
                break;
            
            case '!ayuda':    
                let customCommands = '';
                for (let command of this.config.customCommands){
                    if (!command.isAdminCommand)
                        customCommands += ', '+command.label;
                }
                    
                this.client.say(target, `Comandos disponibles: !ayuda, !puntos, !sorteo, !mensaje, !quehaces${customCommands}.`);
                break;

            case '!admin':
                if (this._checkAdmin(target, username) === false)
                    return;

                let adminCustomCommands = '';
                for (let command of this.config.customCommands){
                    if (command.isAdminCommand)
                        adminCustomCommands += ', '+command.label;
                }
                
                this.client.say(target, `Comandos disponibles: !chatplay, !darpuntos, !quehago, !hazsorteo, !sorteo, !terminasorteo${adminCustomCommands}.`);
                break;

            case '!puntos':
                await this.execPuntos(target, username);
                break;

            case '!mensaje':
                await this.execMensaje(target, username, msg);
                break;

            case '!quehaces':
                await this.execQueHaces(target, username);
                break;

            case '!sorteo':
                await this.execSorteo(target, username);
                break;

            /* COMANDOS ADMIN */

            case '!chatplay':
                await this.execChatPlay(target, username, msg);
                break;

            case '!darpuntos':
                await this.execDarPuntos(target, username, msg);
                break;

            case '!quehago':
                await this.execQueHago(target, username, msg);
                break;

            case '!hazsorteo':
                await this.execHazSorteo(target, username, msg);
                break;

            case '!terminasorteo':
                await this.execTerminaSorteo(target, username, msg);
                break;
        }
    }

    /**
     * Ejecuta un comando personalizado propio
     */
    async execCustomCommand(target, context, msg, self, commandName, username){
        //Iteramos comandos
        for (let customCommand of this.config.customCommands){
            //Si tenemos el comando
            if (customCommand.label === commandName){
                //Sólo admins
                if (customCommand.isAdminCommand && this._checkAdmin(target, username) === false)
                    return;

                //Si es press key, debe estar chat play
                if (customCommand.action === 'KEY' && this._checkChatPlay(target, username) === false)
                    return;    

                //Cobramos
                const applyResult = await this._applyCommandCost(customCommand.cost, target, username);
                if (applyResult === false)
                    return;

                //Reemplazamos variables
                let messageToSend = customCommand.message;
                //[username]
                messageToSend = messageToSend.replaceAll('[username]', username);
                //[rand(x:y)]
                let randSplittedMessage = messageToSend.split('[rand(');
                if (randSplittedMessage.length > 1){
                    randSplittedMessage[1] = randSplittedMessage[1].split(')]');
                    
                    randSplittedMessage[1][0] = randSplittedMessage[1][0].split(':');
                    
                    let min = parseInt(randSplittedMessage[1][0][0]);
                    let max = parseInt(randSplittedMessage[1][0][1]);
                    
                    let result  = this.getRandomInt(min, max);
                    const additionalText  =  (randSplittedMessage[1].length > 1)?randSplittedMessage[1][1]:'';
                    randSplittedMessage[1] = result + additionalText;
                    
                    messageToSend = randSplittedMessage.join(' ');
                }
                
                if (customCommand.action === 'KEY'){
                    this._keyTap(target, username, messageToSend, msg);
                }

                if (customCommand.action === 'VIDEO' ||customCommand.action === 'CHAT'){
                    this.client.say(target, messageToSend);
                }

                if (customCommand.action === 'VIDEO'){
                    this.express.io.emit('customMessage', messageToSend, customCommand.videoImage, customCommand.videoSound);
                }

                break;
            }
        }
    }

    /**
     * Informa al usuario de qué se está haciendo
     */
    async execQueHaces(target, username){
        this.client.say(target, this.currentlyDoing);
    }

    /**
     * Modifica la información de qué se está haciendo
     */
    async execQueHago(target, username, msg){
        if (this._checkAdmin(target, username) === false)
            return;

        this.currentlyDoing = msg.replace('!quehago', '');
    }

    /**
     * Crea un nuevo sorteo
     */
    async execHazSorteo(target, username, msg){
        if (this._checkAdmin(target, username) === false)
            return;
        
        //Si ya existe un sorteo lo sorteamos
        if (this.currentRaffle.active === true){
            //Length de participantes
            const { participants } = this.currentRaffle;
            if (participants.length === 0){
                this.client.say(target, 'No hay participantes para este sorteo, finalízalo con !terminasorteo');
                return;
            }

            //Seleccionamos un participante al azar
            let winner = this.getRandomInt(0, participants.length-1);

            this.client.say(target, `${participants[winner]} es el ganador del sorteo. Reclama ahora tu premio a través del chat. En caso de no encontrarse online, el sorteo se realizará nuevamente.`);
            this.express.io.emit('message', `${participants[winner]} es el ganador del sorteo.`);
            return;
        }

        let cost = msg.split(' ')[1];
        let description = msg.replace(`!hazsorteo ${cost}`, '');
        
        if (cost === undefined || description === ''){
            this.client.say(target, 'Uso: !hazsorteo <coste> <descripción>');
            return;
        }

        cost = Number.parseInt(cost);
        
        this.currentRaffle = {
            active: true,
            description: description,
            cost: cost,
            participants: []
        };

        this.client.say(target, `Participa con !sorteo. Regalamos ${description}.`);
        this.express.io.emit('trumpet', `Participa con !sorteo. Regalamos ${description}.`);
    }

    /**
     * Da por finalizado un sorteo
     */
    async execTerminaSorteo(target, username, msg){
        if (this._checkAdmin(target, username) === false)
            return;
        
        //Si ya existe un sorteo lo paramos
        if (this.currentRaffle.active === true){
            this.currentRaffle.active = false;
            this.client.say(target, `El sorteo ha finalizado, felicidades al ganador.`);
            return;
        }

        this.client.say(target, `No hay ningún sorteo activo actualmente.`);
    }

    
    /**
     * Compra una participación en el sorteo
     */
    async execSorteo(target, username){
        //Si no hay sorteo
        if (this.currentRaffle.active === false){
            this.client.say(target, `No hay ningún sorteo activo actualmente.`);
            return;
        }

        const { cost, description, participants } = this.currentRaffle;

        if (participants.includes(username)){
            this.client.say(target, `${username} ya participa en el sorteo, sólo es posible obtener una participación.`);
            return; 
        }

        const applyResult = await this._applyCommandCost(cost, target, username);
        if (applyResult === false)
            return;

        this.currentRaffle.participants.push(username);
        this.client.say(target, `${username} participa en el sorteo de ${description}.`);
    }

    /**
     * Habilitamos o deshabilitamos el modo de juego por chat
     */
    async execChatPlay(target, username, msg){
        if (this._checkAdmin(target, username) === false)
            return;

        let customCommands = '';
        for (let command of this.config.customCommands){
            if (!command.isAdminCommand && command.action === 'KEY')
                customCommands += ((customCommands.length === 0)?'':', ')+command.label;
        }


        //Mod: Para poder autorizar a jugadores concretos
        let authorizedPlayer = msg.replace(`!chatplay`, '');
        if (authorizedPlayer !== ''){
            this.chatPlayer = authorizedPlayer;
        } else{
            this.chatPlayer = '';
        }

        if (this.chatPlayer === ''){
            this.chatPlay = !this.chatPlay;

            if (this.chatPlay === true)
                this.client.say(target, `Empieza el modo de juego por chat. Usad ${customCommands}.`);
            else
                this.client.say(target, 'El modo de juego por chat ha sido deshabilitado.');
        } else{
            this.client.say(target, `El modo de juego por chat está activado para ${authorizedPlayer}. Usa ${customCommands}.`);
        }


    }

    /**
     * Damos puntos a un usuario
     */
    async execDarPuntos(target, username, msg){
        
        if (this._checkAdmin(target, username) === false)
            return;

        let receiver = msg.split(' ')[1];
        let pointsAmount = msg.split(' ')[2];

        if (receiver === undefined || pointsAmount === undefined){
            this.client.say(target, 'Uso: !darpuntos <nombre> <cantidad>');
            return;
        }

        await this.users.addPoints(receiver, Number.parseInt(pointsAmount));
        this.client.say(target, `¡${username} ha regalado ${pointsAmount} ${this.config.pointName} a ${receiver}!`);
        this.express.io.emit('message', `¡${username} ha regalado ${pointsAmount} ${this.config.pointName} a ${receiver}!`);
    }

    /**
     * Envía un mensaje en voz alta
     */
    async execMensaje(target, username, msg){

        let message = msg.replace(`!mensaje`, '');
        
        if (message === ''){
            this.client.say(target, 'Uso: !mensaje <mensaje>');
            return;
        }

        const applyResult = await this._applyCommandCost(this.config.messageCost, target, username);
        if (applyResult === false)
            return;
            
        this.express.io.emit('saymessage', message);
    }

    /**
     * Consulta los puntos de un usuario y lo envía al chat
     */
    async execPuntos(target, username){
        const pointsNumber = await this.users.getPoints(username);
        this.client.say(target, `${username} tiene ${pointsNumber} ${this.config.pointName}`);
    }

    /**
     * Ejecuta un comando para pulsar una tecla, considerando cuántas veces debe pulsarse la tecla
     */
    _keyTap(target, username, key, msg){
        //El chat play debe estar habilitado
        if (this._checkChatPlay(target, username) === false)
            return;

        // Requerimos dependencias
        var robot = this.robot;   

        let countParams = msg.replace(`!${key}`, '');
        let count = 1;
        if (!isNaN(parseInt(countParams))){
            count = parseInt(countParams);
        }

        //Límite
        if (count > 30)
            count = 30;

        for (let i = 1; i <= count; i++)
            robot.keyTap(key);
        
        return;
    }


    /**
     * Comprueba si podemos ejecutar comandos de chatplay
     */
    _checkChatPlay(target, username){
        if (!this.chatPlay){
            this.client.say(target, `El modo de juego por chat no está habilitado actualmente.`);
            return false;
        }

        if (this.chatPlayer !== '' && this.chatPlayer !== username){
            this.client.say(target, `Actualmente sólo ${this.chatPlayer} puede participar en el juego por chat.`);
            return false;
        }

        return true;
    }

    /**
     * Comprueba si somos administradores antes de ejecutar un comando
     */
    _checkAdmin(target, username){
        if (username !== this.config.adminName){
            this.client.say(target, `¡Sólo ${this.config.adminName} puede ejecutar este comando!`);
            return false;
        }

        return true;
    }

    /**
     * Comprueba si tenemos puntos suficientes para ejecutar un comando, y en tal caso lo ejecuta
     */
    async _applyCommandCost(cost, target, username){
        let points = await this.users.getPoints(username);

        if (points < cost){
            this.client.say(target, `Necesitas ${cost} ${this.config.pointName} para utilizar este comando. Tienes ${points} ${this.config.pointName}.`);
            return false;
        }
        await this.users.removePoints(username, cost);
        return true;
    }
    
    /**
     * Evento disparado al conectarnos a la API de Twitch
     */
    onConnectedHandler (addr, port) {
        this.logger.log(`Connected to ${addr}:${port}`);
    }

    onDisconnectedHandler (reason) { 
        this.logger.log(`Disconnected from Twitch (${reason})`);
    }
}

module.exports = TwitchInit;