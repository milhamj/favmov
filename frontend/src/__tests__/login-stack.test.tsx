import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { StackRouter, StackActions } from '@react-navigation/native';
import Login from '../app/login';
import { Success } from '../model/apiResponse';
let mockState: any;
const stack = StackRouter({});
const options = { routeNames: ['home', 'movie/[id]', 'collection/add', 'login'], routeParamList: {}, routeGetIdList: {} };
const mockDispatch = (action: any) => { mockState = stack.getStateForAction(mockState, action, options)!; };
let mockReturnTo = '';
jest.mock('expo-router', () => ({
 useLocalSearchParams: () => ({ return_to: mockReturnTo }),
 router: {
  replace: (href: string) => { const url = new URL(href, 'https://local'); mockDispatch(require('@react-navigation/native').StackActions.replace(url.pathname.startsWith('/movie/') ? 'movie/[id]' : 'collection/add', Object.fromEntries(url.searchParams))); },
  dismissTo: (href: string) => { const url = new URL(href, 'https://local'); mockDispatch(require('@react-navigation/native').StackActions.popTo(url.pathname.startsWith('/movie/') ? 'movie/[id]' : 'collection/add', url.pathname.startsWith('/movie/') ? { id: url.pathname.split('/')[2], ...Object.fromEntries(url.searchParams) } : Object.fromEntries(url.searchParams))); },
 }
}));
jest.mock('../services/authService', () => ({ signInWithOtp: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)(true))), verifyOtp: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)(true))) }));
beforeEach(() => { jest.useFakeTimers(); mockState = stack.getInitialState(options); });
afterEach(() => jest.useRealTimers());
test.each([false, true])('login returns to existing movie without duplicating it, TV=%s', async isTv => {
 mockDispatch(StackActions.push('movie/[id]', { id: '7', ...(isTv ? { is_tv_show: 'true' } : {}) }));
 mockDispatch(StackActions.push('login'));
 mockReturnTo = '/movie/7' + (isTv ? '?is_tv_show=true' : '');
 await login();
 expect(mockState.routes.map((r: any) => r.name)).toEqual(['home', 'movie/[id]']);
 expect(mockState.routes[1].params.is_tv_show).toBe(isTv ? 'true' : undefined);
 mockDispatch(StackActions.pop());
 expect(mockState.routes[mockState.index].name).toBe('home');
});
test('direct protected login replaces login when destination is absent', async () => {
 mockDispatch(StackActions.push('login'));
 mockReturnTo = '/collection/add?movie_id=7&is_tv_show=true';
 await login();
 expect(mockState.routes.map((r: any) => r.name)).toEqual(['home', 'collection/add']);
 expect(mockState.routes[1].params).toEqual({ movie_id: '7', is_tv_show: 'true' });
});
async function login() {
 const ui = render(<Login/>);
 fireEvent.changeText(ui.getByPlaceholderText('Email'), 'person@example.test');
 await act(async () => { fireEvent.press(ui.getByText('Send OTP')); });
 fireEvent.changeText(ui.getByPlaceholderText('Input your OTP here...'), '123456');
 await act(async () => { fireEvent.press(ui.getByText('LOGIN')); });
 await act(async () => { jest.advanceTimersByTime(2000); });
}
