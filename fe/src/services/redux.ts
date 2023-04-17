import {
  configureStore,
  createSlice,
  ActionReducerMapBuilder,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import metadata from "./metadata";
import { AxiosInstance } from "axios";

type TInitialState = {
  loading: boolean;
  data: any;
  errors: any;
  status: boolean;
};

const initialState: TInitialState = {
  loading: false,
  data: [],
  errors: [],
  status: false,
};

function generate(name: string, apiHandler: any) {
  const thunk = createAsyncThunk("action/" + name, apiHandler);
  const slice = createSlice({
    name: "slice/" + name,
    initialState,
    reducers: {
      reset: (state: TInitialState) => {
        state.loading = initialState.loading;
        state.data = initialState.data;
        state.errors = initialState.errors;
        state.status = initialState.status;
      },
    },
    extraReducers: (builder: ActionReducerMapBuilder<any>) => {
      builder.addCase(thunk.pending, (state: TInitialState, action) => {
        state.loading = true;
        state.data = [];
        state.errors = null;
        state.status = false;
      });
      builder.addCase(thunk.fulfilled, (state: TInitialState, action: any) => {
        if (!action.payload.status) {
          state.data = null;
          state.status = false;
          state.errors = action.payload;
        } else {
          state.data = action.payload;
          state.status = true;
          state.errors = null;
        }
        state.loading = false;
      });
      builder.addCase(thunk.rejected, (state: TInitialState, action) => {
        const errors = JSON.parse(action?.error.message || "")?.data;
        state.loading = false;
        state.data = null;
        state.errors = errors;
        state.status = false;
      });
    },
  });
  return { thunk, slice };
}

export let reduxConfig: any = {};
let reducers = {};

metadata.forEach(
  (file: {
    root: string;
    instance: AxiosInstance;
    child: { name: string; method: any; uri: string }[];
  }) => {
    file.child.forEach((c: { name: string; method: any; uri: string }) => {
      const handler = async function (context: any) {
        try {
          const res = await c.method(c.uri, context, file.instance);
          return res;
        } catch (e: any) {
          throw e;
        }
      };
      const g = generate(c.name, handler);
      reducers = {
        ...reducers,
        [c.name]: g.slice.reducer,
      };
      reduxConfig = {
        ...reduxConfig,
        [c.name]: {
          action: {
            dispatch: g.thunk,
            reset: g.slice.actions.reset,
          },
        },
      };
    });
  }
);

export const store = configureStore({
  reducer: reducers,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
