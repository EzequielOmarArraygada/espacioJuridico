import winston from 'winston';

const customLevelOptions = {
    levels: {
        fatal: 0,
        error: 1,
        warning: 2,
        info: 3,
        debug: 4,
    },
    colors: {
       fatal: 'red',
       error: 'magenta',
       warning: 'yellow',
       info: 'blue',
       debug: 'white',
    }
};

export const devLogger = winston.createLogger({
    levels: customLevelOptions.levels,
    transports: [
        new winston.transports.Console({
            level: 'debug',
            format: winston.format.combine(
                winston.format.colorize({ colors: customLevelOptions.colors }),
                winston.format.simple()
            ),
        }),
    ],
});

winston.addColors(customLevelOptions.colors);

Object.keys(customLevelOptions.levels).forEach((level) => {
    devLogger[level] = function (message) {
        devLogger.log({ level: level, message: message });
    };
});
