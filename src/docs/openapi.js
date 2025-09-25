require('dotenv').config();
const PORT = process.env.PORT || 3001;
const SERVER_URL = process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`;

module.exports = {
  openapi: '3.0.3',
  info: { title: 'FireGuard API', version: '1.0.0' },
  servers: [{ url: SERVER_URL, description: 'Local' }],
  tags: [
    { name: 'Health' }, { name: 'Auth' }, { name: 'Devices' },
    { name: 'Readings' }, { name: 'Reports' }, { name: 'Enroll' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      DeviceUid: { type: 'apiKey', in: 'header', name: 'x-device-uid' },
      EnrollToken: { type: 'apiKey', in: 'header', name: 'x-enroll-token' }
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' }, detail: { type: 'string' } } },
      LoginRequest: { type: 'object', required: ['email','password'], properties: {
        email: { type: 'string', example: 'admin@fireguard.local' }, password: { type: 'string', example: 'admin123' }
      }},
      LoginResponse: { type: 'object', properties: {
        token: { type: 'string' }, user: { type: 'object', properties: {
          id: { type: 'integer' }, email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string', enum: ['admin','viewer'] }
        }}
      }},
      Device: { type: 'object', properties: {
        id:{type:'integer'}, device_uid:{type:'string'}, name:{type:'string'},
        lat:{type:'number',format:'double',nullable:true}, lng:{type:'number',format:'double',nullable:true},
        is_active:{type:'boolean'}, last_seen:{type:'string',format:'date-time',nullable:true}, created_at:{type:'string',format:'date-time'}
      }},
      DeviceCreateRequest: { type: 'object', required: ['device_uid','name'], properties: {
        device_uid:{type:'string',example:'pi-02'}, name:{type:'string',example:'Raspberry #2 (Mixco)'},
        lat:{type:'number',format:'double'}, lng:{type:'number',format:'double'}, api_key:{type:'string'}
      }},
      DeviceCreateResponse: { type: 'object', properties: { ok:{type:'boolean'}, api_key:{type:'string'}, id:{type:'integer'} }},
      DeviceUpdateRequest: { type: 'object', properties: { name:{type:'string'}, lat:{type:'number'}, lng:{type:'number'}, is_active:{type:'boolean'} }},
      Reading: { type: 'object', properties: {
        id:{type:'integer'}, device_id:{type:'integer'}, temperature:{type:'number'}, humidity:{type:'number'},
        pm2_5:{type:'number'}, pm10:{type:'number'}, lat:{type:'number',nullable:true}, lng:{type:'number',nullable:true},
        ts:{type:'string',format:'date-time'}, created_at:{type:'string',format:'date-time'}
      }},
      ReadingIngestRequest: { type: 'object', required: ['temperature','humidity','pm2_5','pm10'], properties: {
        temperature:{type:'number',example:24.6}, humidity:{type:'number',example:61.2},
        pm2_5:{type:'number',example:11.4}, pm10:{type:'number',example:19.8},
        ts:{type:'string',format:'date-time',example:'2025-09-20T20:55:00Z'},
        lat:{type:'number',format:'double',nullable:true}, lng:{type:'number',format:'double',nullable:true}
      }},
      EnrollTokenCreateRequest: { type: 'object', required: ['expiresAt'], properties: {
        expiresAt:{type:'string',format:'date-time',example:'2025-12-31T23:59:59Z'}, maxUses:{type:'integer',example:5}
      }},
      EnrollTokenResponse: { type: 'object', properties: { token:{type:'string'}, expires_at:{type:'string',format:'date-time'}, max_uses:{type:'integer'} }}
    }
  },
  paths: {
    '/api/health': {
      get: { tags:['Health'], summary:'Health check', responses: { 200: { description:'OK' } } }
    },
    '/api/auth/login': {
      post: {
        tags:['Auth'], summary:'Iniciar sesión',
        requestBody:{ required:true, content:{ 'application/json': { schema:{ $ref:'#/components/schemas/LoginRequest' }}}},
        responses:{ 200:{ description:'OK', content:{ 'application/json': { schema:{ $ref:'#/components/schemas/LoginResponse' }}}},
                    401:{ description:'Credenciales inválidas', content:{ 'application/json': { schema:{ $ref:'#/components/schemas/Error' }}}}}
      }
    },
    '/api/devices': {
      get: { tags:['Devices'], security:[{bearerAuth:[]}], summary:'Listar dispositivos',
        responses:{ 200:{ description:'OK', content:{ 'application/json': { schema:{ type:'array', items:{ $ref:'#/components/schemas/Device' }}}}}}
      },
      post: { tags:['Devices'], security:[{bearerAuth:[]}], summary:'Crear dispositivo',
        requestBody:{ required:true, content:{ 'application/json': { schema:{ $ref:'#/components/schemas/DeviceCreateRequest' }}}},
        responses:{ 201:{ description:'Creado', content:{ 'application/json': { schema:{ $ref:'#/components/schemas/DeviceCreateResponse' }}}}}
      }
    },
    '/api/devices/{id}': {
      patch: { tags:['Devices'], security:[{bearerAuth:[]}], summary:'Actualizar dispositivo',
        parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}],
        requestBody:{ required:true, content:{ 'application/json':{ schema:{ $ref:'#/components/schemas/DeviceUpdateRequest' }}}},
        responses:{ 200:{ description:'OK' }, 404:{ description:'No encontrado' } }
      }
    },
    '/api/devices/{id}/rotate-key': {
      post: { tags:['Devices'], security:[{bearerAuth:[]}], summary:'Rotar API key',
        parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}],
        responses:{ 200:{ description:'OK', content:{ 'application/json':{ schema:{ $ref:'#/components/schemas/DeviceCreateResponse' }}}}}
      }
    },
    '/api/devices/{id}/latest': {
      get: { tags:['Devices'], security:[{bearerAuth:[]}], summary:'Última lectura de un device',
        parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}],
        responses:{ 200:{ description:'OK', content:{ 'application/json':{ schema:{ $ref:'#/components/schemas/Reading' }}}}, 404:{ description:'Sin lecturas' } }
      }
    },
    '/api/readings': {
      get: { tags:['Readings'], security:[{bearerAuth:[]}], summary:'Consultar lecturas',
        parameters:[
          {name:'deviceId',in:'query',schema:{type:'integer'}},
          {name:'from',in:'query',schema:{type:'string',format:'date-time'}},
          {name:'to',in:'query',schema:{type:'string',format:'date-time'}},
          {name:'limit',in:'query',schema:{type:'integer',default:500}}
        ],
        responses:{ 200:{ description:'OK', content:{ 'application/json':{ schema:{ type:'array', items:{ $ref:'#/components/schemas/Reading' }}}}}}
      },
      post: { tags:['Readings'], summary:'Ingesta (API key o enrolamiento)',
        description:'Headers: **x-api-key** o **x-device-uid** + **x-enroll-token**',
        security:[ {ApiKeyAuth:[]}, {DeviceUid:[], EnrollToken:[]} ],
        requestBody:{ required:true, content:{ 'application/json':{ schema:{ $ref:'#/components/schemas/ReadingIngestRequest' }}}},
        responses:{ 201:{ description:'Creado', content:{ 'application/json':{ schema:{ type:'object', properties:{ ok:{type:'boolean'}, issuedApiKey:{type:'string',nullable:true} }}}}},
                    401:{ description:'No autorizado' }, 400:{ description:'Petición inválida' } }
      }
    },
    '/api/reports/readings.pdf': {
      get: { tags:['Reports'], security:[{bearerAuth:[]}], summary:'Exportar PDF',
        parameters:[
          {name:'deviceId',in:'query',required:true,schema:{type:'integer'}},
          {name:'from',in:'query',schema:{type:'string',format:'date-time'}},
          {name:'to',in:'query',schema:{type:'string',format:'date-time'}},
          {name:'limit',in:'query',schema:{type:'integer',default:200}}
        ],
        responses:{ 200:{ description:'application/pdf' } }
      }
    },
    '/api/enroll/tokens': {
      post: { tags:['Enroll'], security:[{bearerAuth:[]}], summary:'Crear token de enrolamiento',
        requestBody:{ required:true, content:{ 'application/json':{ schema:{ $ref:'#/components/schemas/EnrollTokenCreateRequest' }}}},
        responses:{ 201:{ description:'Creado', content:{ 'application/json':{ schema:{ $ref:'#/components/schemas/EnrollTokenResponse' }}}}}
      }
    }
  }
};
