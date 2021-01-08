/**
 * Mostrar mensajes por consola
 */
class Config {
    /**
     * CTOR
     */
    constructor(storage){
        this.storage = storage;
    }

    /**
     * Recupera la configuración almacenada
     */
    async getConfig(){
        let config = await this.storage.getItem('config');
        if (config === undefined)
            config = {
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
            };

        return config;
    }

    /**
     * Guarda la configuración
     */
    async setConfig(config){
        await this.storage.setItem('config', config);
    }
}

module.exports = Config;

