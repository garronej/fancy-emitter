import 'should'
import Emitter from '.'

describe('Classic EventEmitter', () => {

    describe('Standard', () => {
        const action = new Emitter

        it('should be activated once', done => {
            action.once(done)
            action.activate()
        })

        it('should be activated three times', done => {
            let times = 0
            action.on(() => {
                if (++times == 3)
                    done()
            })

            action.activate()
                .activate()
                .activate()
        })

        it('should be activated more times', done => {
            let times = 0
            action.on(() => times++)
            action.on(() => {
                if(++times == 6)
                    done()
            })

            action.activate()
                .activate()
                .activate()
        })

        it('should activate both once\'s', done => {
            let times = 0
            const hit = () => {
                if(++times >= 2)
                    done()
            }
            action.once(hit)
            action.once(hit)

            action.activate()
        })
    })

    describe('With a value', () => {
        const action = new Emitter<number>()

        it('should be activated once with 12', done => {
            action.once(val => {
                if(val == 12)
                    done()
            })
            action.activate(12)
        })

        it('should be activated three times increasing', done => {
            let lastVal = 0
            action.on(val => {
                if (val == lastVal + 1)
                    lastVal = val
                if (lastVal == 3)
                    done()
            })

            action.activate(1)
                .activate(2)
                .activate(3)
        })
    })

    describe('Error Handling', () => {
        const action = new Emitter

        it('should cancel an event', done => {
            let times = 0
            action.on(() => {
                if(++times >= 2)
                    done()
            })

            action.activate()
                .activate()
                .cancel()
                .activate()
        })

        it('should continue activate even after an error', done => {
            let times = 0
            action.onContinueAfterError(
                () => {
                    if (times++ == 100)
                        done()
                },
                (err) => {
                    err.should.be.an.instanceOf(Error)
                    if(times == 3)
                        times = 100
                })

            action.activate()
                .activate()
                .activate()
                .deactivate(Error('nothing'))
                .activate()
        })

        it('should continue activate even after a cancellation', done => {
            action.onContinueAfterError(done, err => done(err))

            action.activate()
                .cancel('nothing')
                .activate()
        })
    })
})

/**
 * `setTimeout` is used to run a function after the listeners are put in place.
 * In practice this would never need to be done since the thread activating the
 * event is not the same as the one listening.
 */
describe('New Syntax EventEmitter', () => {

    describe('Empty', () => {
        const action = new Emitter

        it('promise should resolve', async () => {
            setTimeout(() => action.activate())
            await action.next
        })

        it('should be activated three times', async () => {
            setTimeout(() => {
                action.activate()
                    .activate()
                    .activate()
            })

            let times = 0
            for await (let _ of action.all)
                if (++times == 3)
                    break
        })

        it.skip('should be activated more times', async () => {
            setTimeout(() => {
                action.activate()
                    .activate()
                    .activate()
                    .activate()
            })

            let times = 0
            for await (let _ of action.all)
                if (++times == 2)
                    break
            for await (let _ of action.all)
                if (++times == 4)
                    break
            times.should.eql(4)
        })
    })

    describe('With a value', () => {
        const action = new Emitter<number>()

        it('should be activated once with 12', async () => {
            setTimeout(() => action.activate(12))
            const val = await action.next
            val.should.eql(12)
        })
    })

    describe('Error Handling', () => {
        const action = new Emitter

        it('should cancel an event', async () => {
            setTimeout(() => {
                action.activate()
                    .activate()
                    .cancel()
                    .activate()
            })

            let times = 0
            for await (let _ of action.all)
                times++
            times.should.eql(2)
        })

        it.skip('should activate many times, deactivate, then activate again', async () => {
            setTimeout(() => {
                action.activate()
                    .activate()
                    .activate()
                    .deactivate(Error('nothing'))
                    .activate()
            })

            let times = 0,
                gotError = false
            try {
                for await (let _ of action.all)
                    times++
            } catch (e) {
                gotError = true
                e.message.should.eql('nothing')
                await action.next
            }
            times.should.eql(3)
            gotError.should.be.true()
        })
    })
})
