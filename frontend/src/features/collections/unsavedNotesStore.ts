// Losing the session unmounts the editor and no save can succeed, so keep drafts for the return from login.
// base tracks the last server text, including saves finishing after unmount; a changed server note wins over an old draft.
export const unsavedNotes = new Map<string, { draft: string; base: { current: string } }>();
