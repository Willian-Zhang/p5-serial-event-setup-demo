

export
const wait_until = (obj, event) => new Promise(resolve => obj.once(event, resolve));

export
const wait_on = (obj, event) => new Promise(resolve => obj.on(event, resolve));

export
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));


/**
 * 
 * 
 * @param {[[EventListener, string] | [wait, number]]} device_events 
 */
export const wait_race = (device_events) => Promise.race(
    device_events.map(
        async ([device, event]) => {
            let result
            if(device === wait){
                await wait(event)
                result = event;
            }else{
                result = await wait_until(device, event);
            }
            return [device, result]
        }
    )
)