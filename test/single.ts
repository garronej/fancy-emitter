import { spy } from 'sinon'
import { SafeSingleEmitter, SingleEmitter } from '../index.js'
import later from './later.js'

let simple: SafeSingleEmitter
let advance: SingleEmitter<number>

describe('Single usage', () => {
  beforeEach(() => {
    simple = new SafeSingleEmitter
    advance = new SingleEmitter
  })

  it('activated once', done => {
    simple.triggered.should.be.false()
    simple.once(done)
    simple.activate()
    simple.triggered.should.be.true()
  })

  it("should activate both once's", done => {
    const listener = spy()

    simple.once(listener)
    simple.once(listener)

    simple.activate()

    later(() => {
      listener.should.have.been.calledTwice()
      done()
    })
  })

  it('activated once again with 12', async () => {
    later(() => advance.activate(12))
    advance.triggered.should.be.false()
    const val = await advance.event
    advance.triggered.should.be.true()
    val.should.eql(12)
  })

  it('deactivated, never activated', done => {
    advance
      .once(() => { throw 'should not be reached' })
      .catch((e: Error) => {
        e.message.should.eql('Deactivation')
        done()
      })

    advance.deactivate(Error('Deactivation'))
  })

  it('cancelled, never activated nor deactivated', done => {
    advance
      .once(() => done(Error('`fn` should never be called')))
      .catch(() => done(Error('`errFn` should never be called')))

    advance.cancel()
    done()
  })

  it('should not throw unhandled promise rejection for double deactivation', done => {
    // Swallow errors here
    advance.once(() => { }).catch(() => { })
    
    advance.cancel()
    advance.deactivate(Error('deactivation'))
    advance.cancel()

    done()
  })
})
