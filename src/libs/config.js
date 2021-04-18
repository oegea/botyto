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

        const defaultCommands = [
            {
                label: '!hidratacion',
                cost: 30,
                action: 'VIDEO',
                message: '¡[username] cree que es hora de hidratarse!',
                isAdminCommand: false,
                videoImage: 'blueporing.gif',
                videoSound: 'water.mp3',
            },
            {
                label: '!dado',
                cost: 30,
                action: 'VIDEO',
                message: '¡[username] ha lanzado un dado y ha obtenido un [rand(1:6)]!',
                isAdminCommand: false,
                videoImage: 'poring.gif',
                videoSound: 'alert.mp3',
            },
            {
                label: '!discord',
                cost: 0,
                action: 'CHAT',
                message: 'Introduce aquí tu enlace de discord.',
                isAdminCommand: false,
                videoImage: '',
                videoSound: '',
            },
            {
                label: '!donar',
                cost: 0,
                action: 'CHAT',
                message: 'Introduce aquí tu enlace de donaciones.',
                isAdminCommand: false,
                videoImage: '',
                videoSound: '',
            },
        ];

        //Config by default
        let config = await this.storage.getItem('config');
        if (config === undefined){
            config = {
                username: '',
                password: '',
                channelName: '',
                pointName: '',
                pointsPerMinute: 1,
                pointsInterval: 5,
                adminName: '',
                messageCost: 30,
                customCommands: defaultCommands,
                version: 2,
            };
        }

        //Version update, from initial to 2
        if (config.version === undefined){
            config.customCommands = defaultCommands;
            config.customCommands[2].message = config.networkText;
            config.customCommands[3].message = config.donorText;
            config.version = 2;
            //No longer needed params
            delete config.donorText;
            delete config.networkText;
            delete config.hidratacionCost;
            delete config.dadoCost;
        }


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

