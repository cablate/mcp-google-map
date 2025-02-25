export const SEARCH_NEARBY_TOOL = {
  name: "search_nearby",
  description: "搜尋附近的地點",
  inputSchema: {
    type: "object",
    properties: {
      center: {
        type: "object",
        properties: {
          value: { type: "string", description: "地址、地標名稱或經緯度座標(經緯度座標格式: lat,lng)" },
          isCoordinates: { type: "boolean", description: "是否為經緯度座標", default: false },
        },
        required: ["value"],
        description: "搜尋中心點",
      },
      keyword: {
        type: "string",
        description: "搜尋關鍵字（例如：餐廳、咖啡廳）",
      },
      radius: {
        type: "number",
        description: "搜尋半徑（公尺）",
        default: 1000,
      },
      openNow: {
        type: "boolean",
        description: "是否只顯示營業中的地點",
        default: false,
      },
      minRating: {
        type: "number",
        description: "最低評分要求（0-5）",
        minimum: 0,
        maximum: 5,
      },
    },
    required: ["center"],
  },
};

export const GEOCODE_TOOL = {
  name: "maps_geocode",
  description: "將地址轉換為座標",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "要轉換的地址或地標名稱",
      },
    },
    required: ["address"],
  },
};

export const REVERSE_GEOCODE_TOOL = {
  name: "maps_reverse_geocode",
  description: "將座標轉換為地址",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "緯度",
      },
      longitude: {
        type: "number",
        description: "經度",
      },
    },
    required: ["latitude", "longitude"],
  },
};

export const DISTANCE_MATRIX_TOOL = {
  name: "maps_distance_matrix",
  description: "計算多個起點和終點之間的距離和時間",
  inputSchema: {
    type: "object",
    properties: {
      origins: {
        type: "array",
        items: {
          type: "string",
        },
        description: "起點地址或座標列表",
      },
      destinations: {
        type: "array",
        items: {
          type: "string",
        },
        description: "終點地址或座標列表",
      },
      mode: {
        type: "string",
        enum: ["driving", "walking", "bicycling", "transit"],
        description: "交通模式",
        default: "driving",
      },
    },
    required: ["origins", "destinations"],
  },
};

export const DIRECTIONS_TOOL = {
  name: "maps_directions",
  description: "獲取兩點之間的路線指引",
  inputSchema: {
    type: "object",
    properties: {
      origin: {
        type: "string",
        description: "起點地址或座標",
      },
      destination: {
        type: "string",
        description: "終點地址或座標",
      },
      mode: {
        type: "string",
        enum: ["driving", "walking", "bicycling", "transit"],
        description: "交通模式",
        default: "driving",
      },
    },
    required: ["origin", "destination"],
  },
};

export const ELEVATION_TOOL = {
  name: "maps_elevation",
  description: "獲取位置的海拔數據",
  inputSchema: {
    type: "object",
    properties: {
      locations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "緯度",
            },
            longitude: {
              type: "number",
              description: "經度",
            },
          },
          required: ["latitude", "longitude"],
        },
        description: "要獲取海拔數據的位置列表",
      },
    },
    required: ["locations"],
  },
};

export const GET_PLACE_DETAILS_TOOL = {
  name: "get_place_details",
  description: "獲取特定地點的詳細資訊",
  inputSchema: {
    type: "object",
    properties: {
      placeId: {
        type: "string",
        description: "Google Maps 地點 ID",
      },
    },
    required: ["placeId"],
  },
};
