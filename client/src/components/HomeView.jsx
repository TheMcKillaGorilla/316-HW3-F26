/**
 * HomeView.jsx
 *
 * The screen the user lands on: the Wolfie header, a card per list, and the +
 * button that makes a new one. Every handler is a call into ListsContext.
 */
import { useLists } from '../context/ListsContext.jsx';
import { useModals } from '../context/ModalContext.jsx';
import Fab from './Fab.jsx';
import ListCard from './ListCard.jsx';

export default function HomeView() {
    const { metadata, isLoaded, openList, createList, duplicateList, deleteList } = useLists();
    const { askConfirm } = useModals();

    /** deleting a whole list is not undoable, so the warning says so */
    function handleDeleteList(list) {
        askConfirm({
            title: 'Delete This List?',
            message: `The list named "${list.name}" and everything in it will be permanently deleted. Deleting a list cannot be undone.`,
            acceptLabel: 'Delete List',
            onAccept: () => deleteList(list.id)
        });
    }

    return (
        <section className="flex min-h-0 flex-1 flex-col" aria-label="Home">
            <header className="flex items-center justify-center gap-4 bg-sbu-red px-6 py-5
                               text-sbu-white shadow-bar max-[46rem]:gap-3 max-[46rem]:p-4">
                {/* alt is empty because the words beside it already say Wolfie Lists */}
                <img
                    className="h-16 w-auto drop-shadow-[0_0.125rem_0.25rem_rgba(0,0,0,0.35)]
                               max-[46rem]:h-[2.875rem]"
                    src="/images/wolfie-logo.png" alt="" width="1464" height="1054" />
                <h1 className="m-0 font-script text-[3.5rem] leading-[1.1] font-normal
                               tracking-[0.03em] [text-shadow:0_0.125rem_0.25rem_rgba(0,0,0,0.35)]
                               max-[46rem]:text-[2.5rem]">
                    Wolfie Lists
                </h1>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col px-6 pt-5 max-[46rem]:px-3.5 max-[46rem]:pt-4">
                {metadata.length > 0 ? (
                    <ul
                        id="list-card-container"
                        aria-label="Your lists"
                        className="card-container card-scroll m-0 min-h-0 flex-1 list-none
                                   overflow-x-hidden overflow-y-auto pt-0.5 pr-2 pb-22 pl-0.5">
                        {metadata.map((list, index) => (
                            <ListCard
                                key={list.id}
                                list={list}
                                index={index}
                                onOpen={() => openList(list.id)}
                                onDuplicate={() => duplicateList(list.id)}
                                onDelete={() => handleDeleteList(list)} />
                        ))}
                    </ul>
                ) : (
                    <p id="home-empty-message"
                       className="m-auto pb-16 text-center text-[1.0625rem] text-grey-500">
                        {isLoaded ? (
                            <>
                                You do not have any lists yet.<br />
                                Press the <strong>+</strong> button to make your first one.
                            </>
                        ) : 'Loading your lists…'}
                    </p>
                )}

                <Fab id="add-list-button" label="Create a new list" onClick={createList} />
            </div>
        </section>
    );
}
