import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { roomService } from '../../services/roomService';
import { RoomState, Room, User, RoomSettings } from '../../types';

const initialState: RoomState = {
  currentRoom: null,
  participants: [],
  settings: {
    maxParticipants: 10,
    isInterviewMode: false,
    allowAIReview: true,
    allowVideoChat: true,
    hiddenTestsEnabled: false,
    sessionRecording: true,
  },
  isConnected: false,
  connectionStatus: 'disconnected',
  error: null,
};

// Async Thunks
export const createRoom = createAsyncThunk(
  'room/create',
  async (roomData: Partial<Room>, { rejectWithValue }) => {
    try {
      const response = await roomService.createRoom(roomData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'room/join',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await roomService.joinRoom(roomId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join room');
    }
  }
);

export const leaveRoom = createAsyncThunk(
  'room/leave',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await roomService.leaveRoom(roomId);
      return roomId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave room');
    }
  }
);

export const updateRoomSettings = createAsyncThunk(
  'room/updateSettings',
  async (
    { roomId, settings }: { roomId: string; settings: Partial<RoomSettings> },
    { rejectWithValue }
  ) => {
    try {
      const response = await roomService.updateSettings(roomId, settings);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

// Slice
const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
      state.participants = action.payload.participants;
      state.settings = action.payload.settings;
    },
    
    clearCurrentRoom: (state) => {
      state.currentRoom = null;
      state.participants = [];
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
    },
    
    addParticipant: (state, action: PayloadAction<User>) => {
      const exists = state.participants.some((p) => p.id === action.payload.id);
      if (!exists) {
        state.participants.push(action.payload);
      }
    },
    
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter((p) => p.id !== action.payload);
    },
    
    updateParticipant: (state, action: PayloadAction<{ userId: string; updates: Partial<User> }>) => {
      const participant = state.participants.find((p) => p.id === action.payload.userId);
      if (participant) {
        Object.assign(participant, action.payload.updates);
      }
    },
    
    setConnectionStatus: (
      state,
      action: PayloadAction<'connecting' | 'connected' | 'disconnected' | 'error'>
    ) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === 'connected';
    },
    
    updateSettings: (state, action: PayloadAction<Partial<RoomSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
      if (state.currentRoom) {
        state.currentRoom.settings = state.settings;
      }
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Room
    builder.addCase(createRoom.pending, (state) => {
      state.connectionStatus = 'connecting';
      state.error = null;
    });
    builder.addCase(createRoom.fulfilled, (state, action) => {
      state.currentRoom = action.payload;
      state.participants = action.payload.participants;
      state.settings = action.payload.settings;
      state.connectionStatus = 'connected';
      state.isConnected = true;
    });
    builder.addCase(createRoom.rejected, (state, action) => {
      state.connectionStatus = 'error';
      state.error = action.payload as string;
    });

    // Join Room
    builder.addCase(joinRoom.pending, (state) => {
      state.connectionStatus = 'connecting';
      state.error = null;
    });
    builder.addCase(joinRoom.fulfilled, (state, action) => {
      state.currentRoom = action.payload;
      state.participants = action.payload.participants;
      state.settings = action.payload.settings;
      state.connectionStatus = 'connected';
      state.isConnected = true;
    });
    builder.addCase(joinRoom.rejected, (state, action) => {
      state.connectionStatus = 'error';
      state.error = action.payload as string;
    });

    // Leave Room
    builder.addCase(leaveRoom.fulfilled, (state) => {
      state.currentRoom = null;
      state.participants = [];
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
    });

    // Update Settings
    builder.addCase(updateRoomSettings.fulfilled, (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
      if (state.currentRoom) {
        state.currentRoom.settings = state.settings;
      }
    });
  },
});

export const {
  setCurrentRoom,
  clearCurrentRoom,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setConnectionStatus,
  updateSettings,
  setError,
  clearError,
} = roomSlice.actions;

export default roomSlice.reducer;