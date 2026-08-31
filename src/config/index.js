const config = {
  CENTRIFUGE_URL:
    import.meta.env.CENTRIFUGE_URL ||
    'ws://localhost:8000/connection/websocket',

  BASE_URL:
    import.meta.env.BASE_URL ||
    'http://localhost:3000',
}

export default config