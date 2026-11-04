import { routes, safeReturnTo } from '../navigation/routes';
test('encodes a single complete editor destination', () => {
 const destination = '/collection/add?movie_id=7&is_tv_show=true';
 expect(routes.loginWithReturnTo(destination)).toBe('/login?return_to=' + encodeURIComponent(destination));
 expect(safeReturnTo(destination)).toBe(destination);
});
test.each(['https://evil.test', '//evil.test', '/login', '/login?return_to=/collection', '/unknown', '/collection/../login'])('rejects invalid return destination %s', path => {
 expect(safeReturnTo(path)).toBe('/');
});
test('collection tab points to its existing route', () => { expect(routes.collections).toBe('/collection'); });
