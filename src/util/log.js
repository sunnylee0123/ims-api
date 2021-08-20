//Obtained from a previous project I've worked on
const winston = require('winston');

process.on('unhandledRejection', (ex) => {
  throw ex;
});

winston.add(
  winston.createLogger({
    level: "debug",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf((info) => {
        const args = info[Symbol.for('splat')];
        const timeStampSection = `${info.timestamp} `;
        let logLine = `${timeStampSection}${info.level} ${info.message}`;
        if (info.stack) {
          logLine += '\n' + info.stack;
        }
        if (args) {
          let extras = '\n';
          args.map((arg) => {
            extras += JSON.stringify(arg, null, 2);
          });
          logLine += extras;
        }
        return logLine;
      })
    ),
    transports: [new winston.transports.Console()],
    exceptionHandlers: [new winston.transports.Console()],
  })
);

module.exports = winston;
