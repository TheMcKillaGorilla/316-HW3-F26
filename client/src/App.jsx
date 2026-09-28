/**
 * App.jsx
 *
 * The whole application in one screenful. The nesting is the wiring: a
 * component can use a context only if it is inside that context's provider.
 *
 * ModalProvider is outermost because ListsProvider reports server errors
 * through it. CurrentListProvider is mounted only while a list is open, so the
 * open list, and its undo history, are created on opening and thrown away on
 * closing.
 */
import { ListsProvider, useLists } from './context/ListsContext.jsx';
import { CurrentListProvider } from './context/CurrentListContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import HomeView from './components/HomeView.jsx';
import ListView from './components/ListView.jsx';
import ModalLayer, { ItemModalHost } from './components/modals/ModalLayer.jsx';

/** which screen shows is a piece of state; there is no routing */
function CurrentScreen() {
    const { currentListId } = useLists();

    if (currentListId === null) {
        return <HomeView />;
    }

    // the key gives every opened list a provider, and a history, of its own
    return (
        <CurrentListProvider key={currentListId}>
            <ListView />
            <ItemModalHost />
        </CurrentListProvider>
    );
}

export default function App() {
    return (
        <ModalProvider>
            <ListsProvider>
                <div id="app" className="flex h-screen flex-col">
                    <CurrentScreen />
                </div>
                <ModalLayer />
            </ListsProvider>
        </ModalProvider>
    );
}
