function timeCode(data: { name: string; color: string }, type?: 'error') {
    return `\x1b[${type === 'error' ? '31m' : '36m'}[${new Date().toLocaleString()}] ${data.color}[${data.name}]\x1b[0m`;
}

export default class Logger {
    public name: string;
    public color: string;
    constructor(name: string, color: string) {
        this.name = name;
        this.color = '\x1b[38;2;' + color + 'm';
    }
    /**Console logs data with a blue time code */
    public log(...message: any) {
        console.log(timeCode({ name: this.name, color: this.color }), ...message);
    }
    /**Console logs data with a red time code */
    public error(...message: any) {
        console.log(timeCode({ name: this.name, color: this.color }, 'error'), ...message);
    }
}
