
const initialState = {
    loggedIn: false,
    authToken: null,
    displayName: null,
    userId: null
};

const sessionReducer = (state = initialState, action) => {
    switch (action.type) {
        case "LOGIN_USER":
            return {
                ...state,
                loggedIn: true,
                authToken: action.authToken,
                displayName: action.displayName,
                userId: action.userId
            };
        case "CREATE_USER":
            return {
                ...state,
                displayName: action.displayName,
                userId: action.userId
            };
        case "LOGOUT_USER":
            return {
                ...state,
                loggedIn: false,
                authToken: null,
                displayName: null,
                userId: null
            };
        default:
            return state;
    }
};

export default sessionReducer;