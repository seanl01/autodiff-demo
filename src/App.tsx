import Plot from 'react-plotly.js';
import makeGradFn from 'autodiff-ts';
import { useState, useEffect } from 'react';
import githubMarkUrl from "./github-mark.svg";

function generateSurfaceData(
  xRange: [number, number], // [min, max]
  yRange: [number, number], // [min, max]
  points: number, // number of points in each dimension
  zFn: (x: number, y: number) => number // function that takes x,y and returns z
) {
  const x = Array(points).fill(0).map((_, i) =>
    Array(points).fill(xRange[0] + (i * (xRange[1] - xRange[0]) / (points - 1)))
  );

  const y = Array(points).fill(0).map(() =>
    Array(points).fill(0).map((_, j) => yRange[0] + (j * (yRange[1] - yRange[0]) / (points - 1)))
  );

  const z = x.map((xRow, i) =>
    y[i].map((yVal, j) => zFn(xRow[j], yVal))
  );

  return { x, y, z };
}

function App() {
  const [fnText, setFnText] = useState('x ** 2 + y ** 2');
  const [data, setData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Convert text to function
      console.log(fnText)
      // eslint-disable-next-line no-new-func
      const fn = new Function('x', 'y', `return ${fnText}`) as (x: number, y: number) => number;

      const surfaceData = generateSurfaceData([-5, 5], [-5, 5], 100, fn);
      const gradFn = makeGradFn(fn);

      const gradX = generateSurfaceData([-5, 5], [-5, 5], 100,
        (x, y) => gradFn(x, y).gradients[0]);
      const gradY = generateSurfaceData([-5, 5], [-5, 5], 100,
        (x, y) => gradFn(x, y).gradients[1]);

      setData({
        main: surfaceData,
        gradX,
        gradY
      });
    } catch (error) {
      console.error("Error calculating function:", error);
    }
  }, [fnText]);

  const handleFunctionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFnText(e.target.value);
  };

  const handleCopy = () => {
    setIsCopied(true);
    navigator.clipboard.writeText("npm install autodiff-ts")

    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }
  if (!data) return <div>Loading...</div>;

  return (
    <div className='w-full flex flex-col h-[100vh]'>
        <a className='absolute top-3 right-3' href='https://github.com/seanl01/autodiff-ts'>
          <img className='w-8 opacity-50 hover:opacity-100' src={githubMarkUrl}></img>
        </a>
      <div className='w-full text-xl text-center p-6 xs:mt-0 mt-8'>
        <section className='text-left relative grid place-self-center md:text-2xl font-bold font-mono bg-gray-100 rounded-lg py-4 px-8'>npm install autodiff-ts
          <figure className='absolute right-0 top-0 z-10 text-xs font-semibold p-0.5 text-gray-500 bg-gray-200 rounded-lg cursor-default'
            onClick={handleCopy}>
              {isCopied ? "Copied!": "Copy"}
            </figure>
        </section>
        <p className='mt-6'>Visualise the gradients of</p>
        <label htmlFor="function-input">function f(x,y) = </label>
        <input
          id="function-input"
          type="text"
          value={fnText}
          onChange={handleFunctionChange}
          className='border-b'
          placeholder="e.g. x ** 2 + y ** 2"
        />
      </div>

      <div style={{ flex: 1, width: '100%' }}>
        <Plot
          data={[
            {
              x: data.main.x,
              y: data.main.y,
              z: data.main.z,
              type: 'surface',
              colorscale: [
                [0, '#ffcb80'],
                [0.5, '#ff9500'],
                [1, '#ff7b00']
              ],
              name: "f(x,y) = " + fnText,
              showlegend: true
            },
            {
              x: data.gradX.x,
              y: data.gradX.y,
              z: data.gradX.z,
              type: 'surface',
              opacity: 0.7,
              colorscale: [
                [0, '#80d6ff'],
                [0.5, '#00b3ff'],
                [1, '#0091d9']
              ],
              showscale: false,
              name: '∂f/∂x (gradient w.r.t x)',
              showlegend: true
            },
            {
              x: data.gradY.x,
              y: data.gradY.y,
              z: data.gradY.z,
              type: 'surface',
              opacity: 0.7,
              colorscale: [
                [0, '#ff80b0'],
                [0.5, '#ff3d7f'],
                [1, '#e60052']
              ],
              showscale: false,
              name: '∂f/∂y (gradient w.r.t y)',
              showlegend: true
            }
          ]}
          layout={{
            title: { text: 'f(x, y) and partial gradients graphed in 3D' },
            scene: {
              xaxis: { title: { text: 'x' }},
              yaxis: { title: { text: 'y' }},
              zaxis: { title: { text: 'f' } },
            },
            autosize: true,
            datarevision: new Date().getTime(), // to force re-render on data change
            legend: {
              x: 0.01,
              y: 0.99,
              font: {
                size: 15
              },
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              bordercolor: '#ccc',
              borderwidth: 1
            }
          }}
          config={{
            responsive: true,
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

export default App
