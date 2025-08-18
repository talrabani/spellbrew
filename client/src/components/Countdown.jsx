import './Countdown.css'

function Countdown({ countdown }) {
  return (
    <div className="countdown">
      {countdown > 0 ? countdown : 'Get Ready!'}
    </div>
  )
}

export default Countdown
