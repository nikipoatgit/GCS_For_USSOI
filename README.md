# GCS_ground-control-station_For_ussoi
-  Note: There is not Authentication of API requests. `yet to implement `
> **⚠️ Important Note:**
> *  See https://github.com/nikipoatgit/ussoi_camfeed for Android Client  
> *  See https://github.com/nikipoatgit/GCS_For_USSOI for Host Implementation

#### Future Updates :
* nice web ui 
* ability to add turn server and self host one on (tcp only if tunnel don't support udp )
* Basic authentication and multi client support  
* api access based on role  
* MSE + Websocket (this will take time as i have to build it from scratch )

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Tunnel Setup Example](#-tunnel-setup-eg)
- [API Endpoints](#-api-endpoints)
  - [Web Interface](#1-streaming-api-wsipstreaming)
  - [Host WS](#1-streaming-api-wsipstreaming)
  - [Telemetry (GCS)](#1-streaming-api-wsipstreaming)
- [Getting Started](#-getting-started)
---
## Tunnel Setup Example 
This is tutorial video:  https://youtu.be/BnWfbv7Fy-k?si=R0Wx2TWKwuTyaIH1 by 
`Piyush Garg` to setup Basic tunnel with cloudflare if you own a domain then watch from `11:25 min`.
##  System Architecture
![GCS FLOW CHART IMAGE ](doc/FlowChartDjangoBackend.png)

## Django 
The files contain main project server_manager which handles all http and WebSocket (WS) routing it also contains app name core which contains streaming.py and telemetry.py files to handle logic .

## API Endpoints 
There are 4 ws paths and 1 http  which are defined in `wsurls.py` and `urls.py`.

### 1. Web Interface : `ws://local/streaming/api/data` and `http://local`
This ws is connection for Exchange of data from browser to Backend like ICE , SDP , Android Telemetry Data etc while http serves static web UI.

### 2. Host WS :
See https://github.com/nikipoatgit/ussoi_camfeed for response and request Format 

* `ws://local/streaming` 
* `ws://local/telemetry`
* `ws://local/control/api`

### 3. Telemetry (GCS):
The logic is handel by `core/telemetry.py` it is also responsible for creating `~TCP SERVER ~`

> **⚠️  Note:**
>
> * The server only starts when `local/telemetry` receives WS connection i.e Mission Planner (any other if used ) wont connect even if  Django server is running .

## Django Channels 
In `core/streaming.py` Django Channels are used with two groups :

![GCSDjangoGroups](doc/GCSDjangoGroups.png)
        
## Get Started 
![webpageDjabgoGCS](doc/webpageDjabgoGCS.png)
![webpage2DjabgoGCS](doc/webpage2DjabgoGCS.png)
### end of file