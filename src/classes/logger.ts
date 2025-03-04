function timeCode(data: { name: string; color: string }, type?: 'error') {
    return `\x1b[${type === 'error' ? '31m' : '36m'}[${new Date().toLocaleString()}] ${data.color}[${data.name}]\x1b[0m`;
}

export default class Logger {
    /**Console logs data with a blue time code */
    public log;
    /**Console logs data with a red time code */
    public error;
    constructor(name: string, color: string) {
        const parsedColor = `\x1b[38;2;${color}m`;
        this.log = (...message: any) => {
            console.log(timeCode({ name, color: parsedColor }), ...message);
        };
        this.error = (...message: any) => {
            console.log(timeCode({ name, color: parsedColor }, 'error'), ...message);
        };
    }
}
