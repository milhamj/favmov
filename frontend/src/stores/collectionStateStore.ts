class CollectionState {
    private lastUpdated: number | null = null;

    setLastUpdated(timestamp: number): void {
        this.lastUpdated = timestamp;
    }

    getLastUpdated(): number | null {
        return this.lastUpdated;
    }
}

export const CollectionStateStore = new CollectionState();