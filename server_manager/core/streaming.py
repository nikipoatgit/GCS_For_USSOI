
import json
from channels.generic.websocket import AsyncWebsocketConsumer

DATA_STREAM_GROUP = "data_stream" #gp  receive data from phone and send it to web 
DATA_STREAM_GROUP2 = "data_stream2" # gp 2 receive data from web and send it to phone 

class streamingWebSocketConnector(AsyncWebsocketConsumer):
    async def connect(self):
        print("streaming WS Connected") 
        #  The publisher must join the group to receive messages
        await self.channel_layer.group_add(DATA_STREAM_GROUP2, self.channel_name)
        
        await self.channel_layer.group_send(
            DATA_STREAM_GROUP,
            {
                "type":"stream.status",
                "status":"WebRtc connected"
            }
        )
        await self.accept()


    async def disconnect(self, code):
        await self.channel_layer.group_send(
            DATA_STREAM_GROUP,
            {
                "type": "stream.status",
                "status": "WebRtc notConnected"
            }
        )  
        print(f"streaming WS Disconnected with code : {code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if isinstance(data,str):
                data = json.loads(data)
            await self.channel_layer.group_send(
                DATA_STREAM_GROUP,
                {
                    "type": "stream.data",
                    "data": json.dumps(data),
                }
        ) 
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            print(f"Problematic string: {text_data}")

    async def stream_videoControls(self,event):
        data = event["data"]
        await self.send(text_data=data) 

    async def stream_client(self, event):
        pass     

 

class dataExchangeWebSocketConnector(AsyncWebsocketConsumer):     
    async def connect(self):
        print("Data Exchange WS Connected") 
        await self.channel_layer.group_add(DATA_STREAM_GROUP, self.channel_name) #join the group 
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(DATA_STREAM_GROUP, self.channel_name) # leave the gp
        print(f"Data Exchange WS Disconnected with code : {code}")

    async def receive(self, text_data = None, bytes_data = None):
        data_type = json.loads(text_data).get('type')
        if (data_type == 'client'):
            await self.channel_layer.group_send(
                DATA_STREAM_GROUP2,
                {
                    "type": "stream.client",
                    "data": text_data
                }
            )
        else:    
            await self.channel_layer.group_send(
                DATA_STREAM_GROUP2,
                {
                    "type": "stream.videoControls",
                    "data": text_data
                }
            )


    async def stream_data(self, event):
        data = event["data"]
        await self.send(text_data=data)                   

    async def stream_status(self, event):
        status = event["status"]
        await self.send(text_data=json.dumps({
            "type": "getStatus",
            "status": status
        }))       

class controlApiWebSocketConnector(AsyncWebsocketConsumer):  
    async def connect(self):
        await self.channel_layer.group_add(DATA_STREAM_GROUP2, self.channel_name)
        await self.channel_layer.group_send(
            DATA_STREAM_GROUP,
            {
                "type":"stream.status", #  Calls method: stream_status(self, event)
                "status":"Client connected"
            }
        )
        print("Client Control WS Connected") 
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_send(
            DATA_STREAM_GROUP,
            {
                "type": "stream.status",
                "status": "Client notConnected"
            }
        )  
        print(f"streaming WS Disconnected with code : {code}")

    async def receive(self, text_data = None, bytes_data = None):
        try:
            data = json.loads(text_data)
            if isinstance(data,str):
                data = json.loads(data)
            await self.channel_layer.group_send(
                DATA_STREAM_GROUP,
                {
                    "type": "stream.data",
                    "data": json.dumps(data),
                }
        ) 
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            print(f"Problematic string: {text_data}")

    async def stream_client(self,event):
        data = event["data"]
        await self.send(text_data=data)

        # to prevent crashes
    async def stream_videoControls(self, event):
        pass 
        