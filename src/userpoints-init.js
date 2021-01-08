

/**
 * Inicializa la asignación de puntos a usuarios
 */
class UserPointsInit {

    /**
     * CTOR
     */
    constructor(storage, config, logger){
        //Cargamos dependencias
        this.axios = require('axios');
        this.storage = storage;
        this.config = config;
        this.logger = logger;
        const Users = require('./libs/users.js');
        this.users = new Users(storage);
        const MINUTE = 60;
        const MSEC = 1000;
        //Cada cinco minutos otorgamos cinco monedas 
        this.interval = setInterval(this.getChatData.bind(this, this.config.channelName), (this.config.pointsInterval*MINUTE*MSEC));
        this.logger.log('Points timer started.');
    }

    /**
     * Detiene la asignación de puntos
     */
    close(){
        clearInterval(this.interval);
        this.logger.log('Points timer has been stopped.');
    }

    /**
     * Recupera usuarios online y les asigna monedas
     * @param {String} channelName Nombre del canal a monitorizar
     */
    async getChatData(channelName){
        const url = `https://tmi.twitch.tv/group/user/${channelName}/chatters`;
        try{
            const result = await this.axios.get(url);

            const { chatters } = result.data;
            let connectedChatters = [];

            for (let i in chatters){
                connectedChatters.push(...chatters[i]);
            }

            //Iteramos connectedChatters para darles puntos
            for(let i in connectedChatters){
                let username = connectedChatters[i];
                await this.users.addPoints(username, this.config.pointsPerMinute*this.config.pointsInterval);
            }
            this.logger.log('Points assigned to connected users.');
        } catch( exception ){
            console.dir(exception);
        }
        
    
    }
}

module.exports = UserPointsInit;