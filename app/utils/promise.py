import asyncio
from typing import Any, Callable, Coroutine, List, Union


class Promise:
    def __init__(self, coro_or_task: Union[Coroutine, asyncio.Task]):
        self._loop = asyncio.get_event_loop()
        
        # If it's a coroutine, wrap it in a task
        if asyncio.iscoroutine(coro_or_task):
            self._task = asyncio.create_task(coro_or_task)
        else:
            self._task = coro_or_task

        self._success_callbacks = []
        self._failure_callbacks = []
        self._finally_callbacks = []
        
        self._task.add_done_callback(self._resolve_internal)

    def _resolve_internal(self, task: asyncio.Task):
        try:
            if task.cancelled():
                return
            result = task.result()
            for cb in self._success_callbacks:
                cb(result)
        except Exception as e:
            for cb in self._failure_callbacks:
                cb(e)
        finally:
            for cb in self._finally_callbacks:
                cb()

    def then(self, callback: Callable[[Any], None]):
        if self._task.done() and not self._task.cancelled():
            try:
                # If already done, trigger immediately
                callback(self._task.result())
            except Exception:
                pass
        else:
            self._success_callbacks.append(callback)
        return self

    def catch(self, callback: Callable[[BaseException], None]):
        if self._task.done():
            try:
                exc = self._task.exception()
                if exc:
                    callback(exc)
            except asyncio.CancelledError:
                pass
        else:
            self._failure_callbacks.append(callback)
        return self

    def finally_(self, callback: Callable[[], None]):
        if self._task.done():
            callback()
        else:
            self._finally_callbacks.append(callback)
        return self

    @staticmethod
    def all(promises: List['Promise']) -> 'Promise':
        """
        Mimics Promise.all(). 
        Takes a list of Promises and returns a single Promise that resolves 
        when all of them have resolved.
        """
        async def _wait_all():
            # Extract the internal tasks to use asyncio.gather
            tasks = [p._task for p in promises]
            return await asyncio.gather(*tasks)

        return Promise(_wait_all())

    @staticmethod
    def resolve(value: Any) -> 'Promise':
        """
        Returns a Promise object that is resolved with a given value.
        """
        async def _wrapper():
            return value
        return Promise(_wrapper())

    def __await__(self):
        return self._task.__await__()