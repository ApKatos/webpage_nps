export class Client {
    BASE_URL = "localhost:8080";
    headers = "Content-Type: aplication/json";
    async getData(params: object) {
        const api = "/getData"
        const res = await fetch(this.BASE_URL+api, params)
        return await res.json()
    }
}