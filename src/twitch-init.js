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
                break;
            
            case '!ayuda':
                this.client.say(target, `Comandos disponibles: !ayuda, !puntos, !sorteo, !hidratacion, !mensaje, !dado, !quehaces, !donar, !redes.`);
                break;

            case '!puntos':
                await this.execPuntos(target, username);
                break;

            case '!hidratacion':
                await this.execHidratacion(target, username);
                break;

            case '!mensaje':
                await this.execMensaje(target, username, msg);
                break;

            case '!quehaces':
                await this.execQueHaces(target, username);
                break;

            case '!donar':
                this.client.say(target, this.config.donorText);
                break;

            case '!redes':
                this.client.say(target, this.config.networkText);
                break;
            
            case '!dado':
                await this.execDado(target, username);
                break;

            case '!sorteo':
                await this.execSorteo(target, username);
                break;

            /* COMANDOS ADMIN */
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
     * Hidrata al stramer con el comando !hidratacion
     */
    async execHidratacion(target, username){
        const applyResult = await this._applyCommandCost(30, target, username);
        if (applyResult === false)
            return;
            
        this.client.say(target, `¡${username} cree que es hora de hidratarse!`);
        this.express.io.emit('watermessage', `¡${username} cree que es hora de hidratarse!`);
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

        const applyResult = await this._applyCommandCost(30, target, username);
        if (applyResult === false)
            return;
            
        this.express.io.emit('saymessage', message);
    }

    /**
     * Lanza un dado con el comando !dado
     */
    async execDado(target, username){
        const applyResult = await this._applyCommandCost(10, target, username);
        if (applyResult === false)
            return;

        const num = this.getRandomInt(1, 6);
        this.client.say(target, `¡${username} ha lanzado un dado y ha obtenido un ${num}!`);
        this.express.io.emit('message', `¡${username} ha lanzado un dado y ha obtenido un ${num}!`);
    }

    /**
     * Consulta los puntos de un usuario y lo envía al chat
     */
    async execPuntos(target, username){
        const pointsNumber = await this.users.getPoints(username);
        this.client.say(target, `${username} tiene ${pointsNumber} ${this.config.pointName}`);
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